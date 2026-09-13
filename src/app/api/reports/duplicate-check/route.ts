import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// Haversine formula to compute distance in meters
function calculateDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

function computeTextSimilarity(textA: string, textB: string): number {
  const wordsA = new Set(textA.toLowerCase().split(/\W+/).filter((w) => w.length > 3));
  const wordsB = new Set(textB.toLowerCase().split(/\W+/).filter((w) => w.length > 3));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  let intersection = 0;
  for (const w of wordsA) {
    if (wordsB.has(w)) intersection++;
  }
  const union = new Set([...wordsA, ...wordsB]).size;
  return union === 0 ? 0 : Math.round((intersection / union) * 100);
}

export async function POST(req: NextRequest) {
  try {
    const { categoryId, latitude, longitude, description = "", radiusMeters = 150 } = await req.json();

    if (!latitude || !longitude || !categoryId) {
      return NextResponse.json({ duplicates: [] });
    }

    // Active reports within candidate bounding box
    const activeStatuses = [
      "SUBMITTED",
      "RECEIVED",
      "UNDER_REVIEW",
      "ASSIGNED",
      "IN_PROGRESS",
      "ON_HOLD",
      "REOPENED",
    ];

    const activeReports = await prisma.report.findMany({
      where: {
        categoryId,
        status: { in: activeStatuses },
      },
      include: {
        category: true,
        photos: {
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const duplicates = activeReports
      .map((report) => {
        const distance = calculateDistanceInMeters(
          latitude,
          longitude,
          report.latitude,
          report.longitude
        );

        const textSim = description ? computeTextSimilarity(description, `${report.title} ${report.description}`) : 0;

        let confidence: "HIGH" | "MEDIUM" | "LOW" = "LOW";
        if (distance <= 40 && textSim >= 25) confidence = "HIGH";
        else if (distance <= 80 || textSim >= 35) confidence = "MEDIUM";

        return {
          id: report.id,
          referenceNo: report.referenceNo,
          title: report.title,
          description: report.description,
          status: report.status,
          address: report.address,
          photoUrl: report.photos[0]?.photoUrl || null,
          createdAt: report.createdAt,
          distanceMeters: distance,
          textSimilarity: textSim,
          confidence,
        };
      })
      .filter((r) => r.distanceMeters <= radiusMeters)
      .sort((a, b) => a.distanceMeters - b.distanceMeters);

    return NextResponse.json({
      hasDuplicates: duplicates.length > 0,
      duplicates,
    });
  } catch (error: any) {
    console.error("Duplicate check error:", error);
    return NextResponse.json({ error: "Failed to check duplicates" }, { status: 500 });
  }
}
