/**
 * Behavior Analyzer — Evaluates user submission patterns and history.
 * Detects rapid-fire submissions, copy-pasted content, and abuse history.
 * Returns a risk sub-score from 0 (no risk) to 100 (maximum suspicion).
 */

import prisma from "@/lib/db";

interface BehaviorAnalysisResult {
  score: number;
  signals: string[];
  reportsInLastHour: number;
  reportsInLastDay: number;
  isOnCooldown: boolean;
}

// Rate limits
const MAX_REPORTS_PER_HOUR = 5;
const MAX_REPORTS_PER_DAY = 15;
const RAPID_SUBMISSION_MINUTES = 2; // Flag if submitting within 2 minutes of last report

/**
 * Calculate Jaccard similarity between two word sets
 */
function jaccardSimilarity(text1: string, text2: string): number {
  const words1 = new Set(text1.toLowerCase().split(/\s+/).filter((w) => w.length > 2));
  const words2 = new Set(text2.toLowerCase().split(/\s+/).filter((w) => w.length > 2));

  if (words1.size === 0 || words2.size === 0) return 0;

  const intersection = new Set([...words1].filter((w) => words2.has(w)));
  const union = new Set([...words1, ...words2]);

  return intersection.size / union.size;
}

export async function analyzeBehavior(
  userId: string,
  currentDescription: string,
  currentCategoryId: string,
  currentLat: number,
  currentLng: number
): Promise<BehaviorAnalysisResult> {
  const signals: string[] = [];
  let score = 0;

  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // 1. Count recent reports
  const [reportsInLastHour, reportsInLastDay] = await Promise.all([
    prisma.report.count({
      where: { residentId: userId, createdAt: { gte: oneHourAgo } },
    }),
    prisma.report.count({
      where: { residentId: userId, createdAt: { gte: oneDayAgo } },
    }),
  ]);

  // Rate limit checks
  if (reportsInLastHour >= MAX_REPORTS_PER_HOUR) {
    score += 35;
    signals.push(`Rate limit: ${reportsInLastHour} reports in the last hour (max: ${MAX_REPORTS_PER_HOUR})`);
  } else if (reportsInLastHour >= MAX_REPORTS_PER_HOUR - 1) {
    score += 15;
    signals.push(`Approaching hourly rate limit: ${reportsInLastHour} reports`);
  }

  if (reportsInLastDay >= MAX_REPORTS_PER_DAY) {
    score += 25;
    signals.push(`Daily rate limit: ${reportsInLastDay} reports in the last 24 hours (max: ${MAX_REPORTS_PER_DAY})`);
  }

  // 2. Rapid submission detection
  const lastReport = await prisma.report.findFirst({
    where: { residentId: userId },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true, description: true, categoryId: true, latitude: true, longitude: true },
  });

  if (lastReport) {
    const minutesSinceLast = (now.getTime() - new Date(lastReport.createdAt).getTime()) / 60000;
    if (minutesSinceLast < RAPID_SUBMISSION_MINUTES) {
      score += 15;
      signals.push(`Rapid submission: only ${minutesSinceLast.toFixed(1)} minutes since last report`);
    }
  }

  // 3. Description similarity with recent reports
  const recentReports = await prisma.report.findMany({
    where: { residentId: userId, createdAt: { gte: oneDayAgo } },
    select: { description: true, categoryId: true },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  let highSimilarityCount = 0;
  for (const recent of recentReports) {
    const similarity = jaccardSimilarity(currentDescription, recent.description);
    if (similarity > 0.8) {
      highSimilarityCount++;
    }
  }

  if (highSimilarityCount >= 3) {
    score += 30;
    signals.push(`${highSimilarityCount} recent reports with highly similar descriptions (copy-paste suspected)`);
  } else if (highSimilarityCount >= 1) {
    score += 15;
    signals.push(`${highSimilarityCount} recent report(s) with similar description`);
  }

  // 4. Re-reporting same category at same location (after review/rejection)
  const previousSameLocation = await prisma.report.findMany({
    where: {
      residentId: userId,
      categoryId: currentCategoryId,
      status: { in: ["REJECTED", "CLOSED"] },
      latitude: { gte: currentLat - 0.001, lte: currentLat + 0.001 },
      longitude: { gte: currentLng - 0.001, lte: currentLng + 0.001 },
    },
    take: 5,
  });

  if (previousSameLocation.length > 0) {
    score += 20;
    signals.push(`Re-reporting same category at a previously reviewed/rejected location (${previousSameLocation.length} match(es))`);
  }

  // 5. Check user trust profile for abuse history
  const trustProfile = await prisma.userTrustProfile.findUnique({
    where: { userId },
  });

  if (trustProfile) {
    if (trustProfile.spamCount >= 3) {
      score += 25;
      signals.push(`User has ${trustProfile.spamCount} previous spam flags`);
    } else if (trustProfile.spamCount >= 1) {
      score += 10;
      signals.push(`User has ${trustProfile.spamCount} previous spam flag(s)`);
    }

    if (trustProfile.rejectedCount >= 5) {
      score += 20;
      signals.push(`User has ${trustProfile.rejectedCount} rejected reports`);
    } else if (trustProfile.rejectedCount >= 2) {
      score += 10;
      signals.push(`User has ${trustProfile.rejectedCount} rejected report(s)`);
    }

    // Low trust score
    if (trustProfile.trustScore < 20) {
      score += 20;
      signals.push(`Low user trust score: ${trustProfile.trustScore}/100`);
    } else if (trustProfile.trustScore < 35) {
      score += 10;
      signals.push(`Below-average user trust score: ${trustProfile.trustScore}/100`);
    }
  }

  // Check cooldown
  const isOnCooldown = !!(trustProfile?.cooldownUntil && new Date(trustProfile.cooldownUntil) > now);
  if (isOnCooldown) {
    score += 30;
    signals.push("User is currently on submission cooldown");
  }

  return {
    score: Math.min(score, 100),
    signals,
    reportsInLastHour,
    reportsInLastDay,
    isOnCooldown,
  };
}
