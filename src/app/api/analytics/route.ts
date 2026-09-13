import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentUser, isStaffOrAdmin } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getCurrentUser();
    if (!session || !isStaffOrAdmin(session.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [
      totalReports,
      submittedCount,
      underReviewCount,
      inProgressCount,
      resolvedCount,
      closedCount,
      reopenedCount,
      criticalCount,
      categories,
      agencies,
      allReports,
    ] = await Promise.all([
      prisma.report.count(),
      prisma.report.count({ where: { status: "SUBMITTED" } }),
      prisma.report.count({ where: { status: "UNDER_REVIEW" } }),
      prisma.report.count({ where: { status: "IN_PROGRESS" } }),
      prisma.report.count({ where: { status: "RESOLVED" } }),
      prisma.report.count({ where: { status: "CLOSED" } }),
      prisma.report.count({ where: { status: "REOPENED" } }),
      prisma.report.count({ where: { priority: "CRITICAL", status: { notIn: ["CLOSED", "REJECTED"] } } }),
      prisma.category.findMany({
        select: {
          id: true,
          name: true,
          _count: { select: { reports: true } },
        },
      }),
      prisma.agency.findMany({
        select: {
          id: true,
          name: true,
          code: true,
          _count: { select: { reports: true } },
        },
      }),
      prisma.report.findMany({
        select: {
          id: true,
          status: true,
          priority: true,
          latitude: true,
          longitude: true,
          category: { select: { name: true } },
          createdAt: true,
          resolvedAt: true,
          slaDeadline: true,
        },
      }),
    ]);

    // Calculate overdue reports
    const now = new Date();
    const overdueCount = allReports.filter(
      (r) => r.slaDeadline && new Date(r.slaDeadline) < now && !["CLOSED", "RESOLVED", "REJECTED"].includes(r.status)
    ).length;

    // Calculate average resolution time (in hours)
    const resolvedWithDates = allReports.filter((r) => r.resolvedAt);
    let avgResolutionHours = 0;
    if (resolvedWithDates.length > 0) {
      const totalHours = resolvedWithDates.reduce((acc, r) => {
        const diffMs = new Date(r.resolvedAt!).getTime() - new Date(r.createdAt).getTime();
        return acc + diffMs / (1000 * 60 * 60);
      }, 0);
      avgResolutionHours = Math.round((totalHours / resolvedWithDates.length) * 10) / 10;
    }

    // Resolution rate %
    const totalFinished = resolvedCount + closedCount;
    const resolutionRate = totalReports > 0 ? Math.round((totalFinished / totalReports) * 100) : 0;

    // Detect Hotspots (cluster detection: reports within ~0.002 lat/lon degree ~200m)
    const activeForHotspots = allReports.filter((r) => !["CLOSED", "REJECTED"].includes(r.status));
    const hotspots: Array<{
      category: string;
      count: number;
      latitude: number;
      longitude: number;
      sampleAddress?: string;
    }> = [];

    const visited = new Set<string>();
    for (let i = 0; i < activeForHotspots.length; i++) {
      if (visited.has(activeForHotspots[i].id)) continue;
      const target = activeForHotspots[i];
      const cluster = [target];
      visited.add(target.id);

      for (let j = i + 1; j < activeForHotspots.length; j++) {
        if (visited.has(activeForHotspots[j].id)) continue;
        const candidate = activeForHotspots[j];
        const distLat = Math.abs(target.latitude - candidate.latitude);
        const distLng = Math.abs(target.longitude - candidate.longitude);

        if (distLat < 0.0025 && distLng < 0.0025) {
          cluster.push(candidate);
          visited.add(candidate.id);
        }
      }

      if (cluster.length >= 2) {
        const avgLat = cluster.reduce((sum, c) => sum + c.latitude, 0) / cluster.length;
        const avgLng = cluster.reduce((sum, c) => sum + c.longitude, 0) / cluster.length;
        hotspots.push({
          category: target.category?.name || "Multiple Issues",
          count: cluster.length,
          latitude: avgLat,
          longitude: avgLng,
        });
      }
    }

    return NextResponse.json({
      metrics: {
        totalReports,
        submitted: submittedCount,
        underReview: underReviewCount,
        inProgress: inProgressCount,
        resolved: resolvedCount,
        closed: closedCount,
        reopened: reopenedCount,
        critical: criticalCount,
        overdue: overdueCount,
        avgResolutionHours,
        resolutionRate,
      },
      byCategory: categories.map((c) => ({ name: c.name, count: c._count.reports })),
      byAgency: agencies.map((a) => ({ name: a.name, code: a.code, count: a._count.reports })),
      hotspots,
    });
  } catch (error: any) {
    console.error("Analytics error:", error);
    return NextResponse.json({ error: "Failed to generate analytics" }, { status: 500 });
  }
}
