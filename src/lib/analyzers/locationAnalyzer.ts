/**
 * Location Analyzer — Evaluates report location for suspicious patterns.
 * Checks boundary compliance, location scatter, and impossible coordinates.
 * Returns a risk sub-score from 0 (no risk) to 100 (maximum suspicion).
 */

import prisma from "@/lib/db";

interface LocationAnalysisResult {
  score: number;
  signals: string[];
  isOutOfBounds: boolean;
}

// Barangay San Antonio, Pasig City approximate bounding box
// Configurable — can be moved to SystemSettings in the future
const COVERAGE_BOUNDS = {
  minLat: 14.54,
  maxLat: 14.63,
  minLng: 121.04,
  maxLng: 121.10,
};

// Extended Metro Manila bounding box (generous)
const METRO_MANILA_BOUNDS = {
  minLat: 14.35,
  maxLat: 14.80,
  minLng: 120.90,
  maxLng: 121.20,
};

/**
 * Haversine distance between two points in meters
 */
function distanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export async function analyzeLocation(
  latitude: number,
  longitude: number,
  userId: string
): Promise<LocationAnalysisResult> {
  const signals: string[] = [];
  let score = 0;
  let isOutOfBounds = false;

  // 1. Check if within barangay coverage area
  const inCoverage =
    latitude >= COVERAGE_BOUNDS.minLat &&
    latitude <= COVERAGE_BOUNDS.maxLat &&
    longitude >= COVERAGE_BOUNDS.minLng &&
    longitude <= COVERAGE_BOUNDS.maxLng;

  if (!inCoverage) {
    // Check if at least in Metro Manila
    const inMetro =
      latitude >= METRO_MANILA_BOUNDS.minLat &&
      latitude <= METRO_MANILA_BOUNDS.maxLat &&
      longitude >= METRO_MANILA_BOUNDS.minLng &&
      longitude <= METRO_MANILA_BOUNDS.maxLng;

    if (!inMetro) {
      score += 40;
      signals.push("Location is outside Metro Manila — significantly out of coverage area");
      isOutOfBounds = true;
    } else {
      score += 15;
      signals.push("Location is outside barangay coverage area but within Metro Manila");
      isOutOfBounds = true;
    }
  }

  // 2. Check for impossible coordinates (ocean, etc.)
  // Simple check: Philippines is generally 4.5-21°N, 116-127°E
  const inPhilippines =
    latitude >= 4.5 && latitude <= 21.5 && longitude >= 116 && longitude <= 127;
  if (!inPhilippines) {
    score += 50;
    signals.push("Coordinates are outside the Philippines entirely");
    isOutOfBounds = true;
  }

  // 3. Location scatter analysis — check if user's recent reports are from wildly different areas
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentReports = await prisma.report.findMany({
    where: {
      residentId: userId,
      createdAt: { gte: oneDayAgo },
    },
    select: { latitude: true, longitude: true },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  if (recentReports.length >= 3) {
    // Calculate max spread among recent reports
    let maxDistance = 0;
    for (let i = 0; i < recentReports.length; i++) {
      for (let j = i + 1; j < recentReports.length; j++) {
        const d = distanceInMeters(
          recentReports[i].latitude,
          recentReports[i].longitude,
          recentReports[j].latitude,
          recentReports[j].longitude
        );
        maxDistance = Math.max(maxDistance, d);
      }
    }

    // Include current report in spread calculation
    for (const r of recentReports) {
      const d = distanceInMeters(latitude, longitude, r.latitude, r.longitude);
      maxDistance = Math.max(maxDistance, d);
    }

    // If reports span more than 5km in a day, that's suspicious
    if (maxDistance > 10000) {
      score += 25;
      signals.push(`Location scatter: reports spread across ${(maxDistance / 1000).toFixed(1)}km in 24 hours`);
    } else if (maxDistance > 5000) {
      score += 15;
      signals.push(`Moderate location scatter: ${(maxDistance / 1000).toFixed(1)}km spread in 24 hours`);
    }
  }

  return {
    score: Math.min(score, 100),
    signals,
    isOutOfBounds,
  };
}
