import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentUser, isStaffOrAdmin } from "@/lib/auth";

/**
 * GET /api/reports/[id]/risk
 * Returns full risk assessment data for a specific report.
 * Staff/Admin only.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getCurrentUser();
    if (!session || !isStaffOrAdmin(session.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const report = await prisma.report.findFirst({
      where: { OR: [{ id }, { referenceNo: id }] },
      select: {
        id: true,
        residentId: true,
        riskScore: true,
        riskLevel: true,
        verificationStatus: true,
        latitude: true,
        longitude: true,
        categoryId: true,
      },
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // Fetch risk assessment
    const riskAssessment = await prisma.reportRiskAssessment.findUnique({
      where: { reportId: report.id },
    });

    // Fetch moderation history
    const moderationActions = await prisma.moderationAction.findMany({
      where: { reportId: report.id },
      orderBy: { createdAt: "desc" },
    });

    // Fetch user trust profile
    const userTrust = await prisma.userTrustProfile.findUnique({
      where: { userId: report.residentId },
    });

    // Fetch user's recent reports summary
    const userReportStats = await prisma.report.groupBy({
      by: ["status"],
      where: { residentId: report.residentId },
      _count: true,
    });

    // Fetch nearby reports in same category (potential duplicates)
    const nearbyReports = await prisma.report.findMany({
      where: {
        id: { not: report.id },
        categoryId: report.categoryId,
        latitude: { gte: report.latitude - 0.002, lte: report.latitude + 0.002 },
        longitude: { gte: report.longitude - 0.002, lte: report.longitude + 0.002 },
      },
      select: {
        id: true,
        referenceNo: true,
        title: true,
        status: true,
        address: true,
        createdAt: true,
        photos: { take: 1 },
      },
      take: 5,
      orderBy: { createdAt: "desc" },
    });

    // Fetch verification requests
    const verificationRequests = await prisma.verificationRequest.findMany({
      where: { reportId: report.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      riskAssessment: riskAssessment
        ? {
            ...riskAssessment,
            signals: riskAssessment.signals ? JSON.parse(riskAssessment.signals) : [],
          }
        : null,
      moderationActions,
      userTrust,
      userReportStats,
      nearbyReports,
      verificationRequests,
    });
  } catch (error: any) {
    console.error("Risk detail error:", error);
    return NextResponse.json({ error: "Failed to fetch risk data" }, { status: 500 });
  }
}
