/**
 * Report Risk Analyzer — Orchestrates all sub-analyzers and produces a composite risk assessment.
 * 
 * Scoring thresholds:
 *   0–30  → LOW risk    → Auto-approve, proceed normally
 *   31–70 → MEDIUM risk → Auto-approve but flag for staff awareness
 *   71–100 → HIGH risk  → Set status to PENDING_VERIFICATION, notify staff
 */

import prisma from "@/lib/db";
import { analyzeText } from "./analyzers/textAnalyzer";
import { analyzeImage } from "./analyzers/imageAnalyzer";
import { analyzeBehavior } from "./analyzers/behaviorAnalyzer";
import { analyzeLocation } from "./analyzers/locationAnalyzer";
import { moderateReportWithAI } from "./aiService";

export interface RiskAnalysisInput {
  reportId: string;
  userId: string;
  description: string;
  categorySlug: string;
  categoryId: string;
  latitude: number;
  longitude: number;
  photos: Array<{ url: string; type?: string }>;
}

export interface RiskAnalysisResult {
  totalScore: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  textScore: number;
  imageScore: number;
  duplicateScore: number;
  locationScore: number;
  behaviorScore: number;
  categoryMismatchScore: number;
  action: "AUTO_APPROVE" | "PENDING_VERIFICATION";
  signals: string[];
  summary: string;
}

// Weights for each signal category (must sum to reasonable proportions)
const WEIGHTS = {
  text: 0.20,
  image: 0.20,
  behavior: 0.30,
  location: 0.15,
  categoryMismatch: 0.15,
};

function determineRiskLevel(score: number): "LOW" | "MEDIUM" | "HIGH" {
  if (score <= 30) return "LOW";
  if (score <= 70) return "MEDIUM";
  return "HIGH";
}

function generateSummary(
  riskLevel: string,
  signals: string[],
  scores: {
    text: number;
    image: number;
    behavior: number;
    location: number;
  }
): string {
  if (signals.length === 0) {
    return "No suspicious signals detected. Report appears legitimate.";
  }

  const parts: string[] = [];

  if (riskLevel === "HIGH") {
    parts.push("⚠️ HIGH RISK — This report requires manual verification before processing.");
  } else if (riskLevel === "MEDIUM") {
    parts.push("ℹ️ MEDIUM RISK — Some suspicious signals detected. Report was auto-approved but flagged for awareness.");
  }

  // Highlight top concerns
  const topConcerns: string[] = [];
  if (scores.behavior > 30) topConcerns.push("submission behavior patterns");
  if (scores.text > 30) topConcerns.push("text quality issues");
  if (scores.image > 30) topConcerns.push("image concerns");
  if (scores.location > 30) topConcerns.push("location anomalies");

  if (topConcerns.length > 0) {
    parts.push(`Primary concerns: ${topConcerns.join(", ")}.`);
  }

  parts.push(`${signals.length} risk signal(s) identified.`);

  return parts.join(" ");
}

export async function analyzeReport(input: RiskAnalysisInput): Promise<RiskAnalysisResult> {
  const allSignals: string[] = [];

  // 1. Text Analysis
  const textResult = analyzeText(input.description, input.categorySlug);
  allSignals.push(...textResult.signals.map((s) => `[Text] ${s}`));

  // 2. Image Analysis
  let imageScore = 0;
  let duplicateScore = 0;
  for (const photo of input.photos) {
    try {
      const imgResult = await analyzeImage(
        photo.url,
        "image/jpeg", // Default; actual MIME is validated at upload time
        input.userId,
        input.reportId
      );
      imageScore = Math.max(imageScore, imgResult.score);
      allSignals.push(...imgResult.signals.map((s) => `[Image] ${s}`));

      if (imgResult.duplicateMatches.length > 0) {
        duplicateScore = Math.max(duplicateScore, imgResult.duplicateMatches.length * 25);
      }
    } catch (err) {
      console.error("Image analysis error for", photo.url, err);
    }
  }
  duplicateScore = Math.min(duplicateScore, 100);

  // 3. Behavior Analysis
  const behaviorResult = await analyzeBehavior(
    input.userId,
    input.description,
    input.categoryId,
    input.latitude,
    input.longitude
  );
  allSignals.push(...behaviorResult.signals.map((s) => `[Behavior] ${s}`));

  // 4. Location Analysis
  const locationResult = await analyzeLocation(
    input.latitude,
    input.longitude,
    input.userId
  );
  allSignals.push(...locationResult.signals.map((s) => `[Location] ${s}`));

  // 5. Category-Mismatch Score (extracted from text analysis coherence check)
  const categoryMismatchScore = textResult.signals.some((s) => s.includes("category"))
    ? 25
    : 0;

  // 6. AI Multimodal Moderation & Safety Hazard Detection Layer
  let aiResult = null;
  try {
    aiResult = await moderateReportWithAI({
      description: input.description,
      categorySlug: input.categorySlug,
      categoryName: input.categorySlug,
      photoUrls: input.photos.map((p) => p.url),
    });

    if (aiResult) {
      allSignals.push(`[AI Assessment] Quality: ${aiResult.description_quality} | Category Match: ${aiResult.category_match} | Image Relevance: ${aiResult.image_relevance}`);
      if (aiResult.reason) {
        allSignals.push(`[AI Insight] ${aiResult.reason}`);
      }
      if (aiResult.is_ai_generated_suspected) {
        allSignals.push(`[AI Signal] Potential synthetic/AI-generated pattern flagged for staff verification`);
      }
      if (aiResult.safety_hazard) {
        allSignals.push(`[AI Safety] ⚠️ Public Safety Hazard: ${aiResult.safety_hazard_details || "Potential hazard to life or property"}`);
      }
    }
  } catch (err) {
    console.warn("AI moderation call non-blocking fallback:", err);
  }

  // Calculate weighted composite score
  const baseWeightedScore = Math.round(
    textResult.score * WEIGHTS.text +
    imageScore * WEIGHTS.image +
    behaviorResult.score * WEIGHTS.behavior +
    locationResult.score * WEIGHTS.location +
    categoryMismatchScore * WEIGHTS.categoryMismatch
  );

  // If AI flagged high suspicion or image mismatch, elevate score appropriately
  let adjustedScore = baseWeightedScore;
  if (aiResult?.suspicion_level === "high") {
    adjustedScore = Math.max(adjustedScore, 75);
  } else if (aiResult?.suspicion_level === "medium") {
    adjustedScore = Math.max(adjustedScore, 45);
  }

  // Boost: if behavior analyzer detected cooldown, force HIGH
  const totalScore = behaviorResult.isOnCooldown
    ? Math.max(adjustedScore, 75)
    : Math.min(adjustedScore, 100);

  const riskLevel = determineRiskLevel(totalScore);
  const action = riskLevel === "HIGH" ? "PENDING_VERIFICATION" : "AUTO_APPROVE";

  const summary = aiResult?.reason
    ? `${generateSummary(riskLevel, allSignals, {
        text: textResult.score,
        image: imageScore,
        behavior: behaviorResult.score,
        location: locationResult.score,
      })} AI Summary: ${aiResult.reason}`
    : generateSummary(riskLevel, allSignals, {
        text: textResult.score,
        image: imageScore,
        behavior: behaviorResult.score,
        location: locationResult.score,
      });

  // Persist risk assessment if report exists in database
  try {
    const existingReport = await prisma.report.findUnique({
      where: { id: input.reportId },
      select: { id: true },
    });

    if (existingReport) {
      await prisma.reportRiskAssessment.create({
        data: {
          reportId: input.reportId,
          totalScore,
          riskLevel,
          textScore: textResult.score,
          imageScore,
          duplicateScore,
          locationScore: locationResult.score,
          behaviorScore: behaviorResult.score,
          categoryMismatchScore,
          actionTaken: action,
          signals: JSON.stringify(allSignals),
          summary,
        },
      });

      // Update report with risk data & safety escalation if AI detected hazard
      const updateData: any = {
        riskScore: totalScore,
        riskLevel,
        ...(action === "PENDING_VERIFICATION"
          ? {
              status: "PENDING_VERIFICATION",
              verificationStatus: "PENDING_VERIFICATION",
            }
          : {}),
      };

      if (aiResult?.safety_hazard) {
        updateData.safetyFlag = "URGENT";
        updateData.priority = "CRITICAL";
      }

      await prisma.report.update({
        where: { id: input.reportId },
        data: updateData,
      });
    }
  } catch (err) {
    console.error("Failed to persist risk assessment:", err);
  }

  return {
    totalScore,
    riskLevel,
    textScore: textResult.score,
    imageScore,
    duplicateScore,
    locationScore: locationResult.score,
    behaviorScore: behaviorResult.score,
    categoryMismatchScore,
    action,
    signals: allSignals,
    summary,
  };
}
