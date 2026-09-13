import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentUser, isStaffOrAdmin } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import { updateTrustAfterModeration } from "@/lib/userTrust";

/**
 * GET /api/reports/moderation
 * List reports needing verification with risk data and user history.
 * Staff/Admin only.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || !isStaffOrAdmin(session.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter") || "pending"; // pending, all, high, medium
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const skip = (page - 1) * limit;

    const whereClause: any = {};

    if (filter === "pending") {
      whereClause.verificationStatus = "PENDING_VERIFICATION";
    } else if (filter === "high") {
      whereClause.riskLevel = "HIGH";
    } else if (filter === "medium") {
      whereClause.riskLevel = "MEDIUM";
    }

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where: whereClause,
        include: {
          category: true,
          photos: { take: 2 },
          resident: {
            select: { id: true, name: true, email: true },
          },
          riskAssessment: true,
          moderationActions: {
            orderBy: { createdAt: "desc" },
            take: 5,
          },
          verificationRequests: {
            orderBy: { createdAt: "desc" },
            take: 3,
          },
        },
        orderBy: [
          { riskScore: "desc" },
          { createdAt: "desc" },
        ],
        skip,
        take: limit,
      }),
      prisma.report.count({ where: whereClause }),
    ]);

    // Enrich with user trust profiles
    const enrichedReports = await Promise.all(
      reports.map(async (report) => {
        const trustProfile = await prisma.userTrustProfile.findUnique({
          where: { userId: report.residentId },
        });

        // Count total reports by this user
        const userReportCount = await prisma.report.count({
          where: { residentId: report.residentId },
        });

        return {
          ...report,
          userTrustProfile: trustProfile || null,
          userReportCount,
        };
      })
    );

    return NextResponse.json({
      reports: enrichedReports,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    console.error("Moderation list error:", error);
    return NextResponse.json({ error: "Failed to fetch moderation queue" }, { status: 500 });
  }
}

/**
 * POST /api/reports/moderation
 * Perform a moderation action on a report.
 * Staff/Admin only.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || !isStaffOrAdmin(session.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const {
      reportId,
      actionType, // APPROVE, REJECT, REQUEST_INFO, MARK_SPAM, MERGE_DUPLICATE, FLAG_USER
      flagType,   // SPAM, PRANK_FAKE, DUPLICATE, INCORRECT_CATEGORY, etc.
      reason,
      evidence,
      // For REQUEST_INFO
      verificationRequestType, // CONFIRM_LOCATION, RETAKE_PHOTO, ADD_DETAILS, GENERAL
      verificationMessage,
      // For MERGE_DUPLICATE
      mergeIntoReportId,
    } = body;

    if (!reportId || !actionType) {
      return NextResponse.json(
        { error: "Report ID and action type are required" },
        { status: 400 }
      );
    }

    const report = await prisma.report.findUnique({
      where: { id: reportId },
      include: { resident: true, category: true },
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    const previousStatus = report.status;
    let newStatus = report.status;
    let notificationTitle = "";
    let notificationMessage = "";

    // Determine new status and notification based on action
    switch (actionType) {
      case "APPROVE":
        newStatus = "SUBMITTED"; // Return to normal workflow
        notificationTitle = "Report Verified";
        notificationMessage = `Your report ${report.referenceNo} has been verified and is being processed.`;
        break;

      case "REJECT":
        newStatus = "REJECTED";
        notificationTitle = "Report Update";
        notificationMessage = `Your report ${report.referenceNo} could not be processed. ${reason ? "Reason: " + reason : "Please contact the barangay office for more information."}`;
        break;

      case "REQUEST_INFO":
        newStatus = "PENDING_VERIFICATION"; // Keep in pending
        notificationTitle = "Additional Information Needed";
        notificationMessage = verificationMessage || `We need a little more information about your report ${report.referenceNo}. Please check your report for details.`;
        break;

      case "MARK_SPAM":
        newStatus = "REJECTED";
        notificationTitle = "Report Update";
        notificationMessage = `Your report ${report.referenceNo} has been reviewed and could not be processed at this time.`;
        break;

      case "MERGE_DUPLICATE":
        newStatus = "CLOSED";
        notificationTitle = "Report Merged";
        notificationMessage = `Your report ${report.referenceNo} has been merged with an existing report covering the same issue. The original report is being tracked.`;
        break;

      case "FLAG_USER":
        // Don't change report status, just flag the user
        break;
    }

    // 1. Create moderation action record
    const moderationAction = await prisma.moderationAction.create({
      data: {
        reportId,
        moderatorId: session.id,
        actionType,
        flagType: flagType || null,
        reason: reason || null,
        previousStatus,
        newStatus,
        riskSignalsUsed: report.riskScore ? JSON.stringify({ riskScore: report.riskScore, riskLevel: report.riskLevel }) : null,
        evidence: evidence || null,
      },
    });

    // 2. Update report status
    if (actionType !== "FLAG_USER") {
      const updateData: any = { status: newStatus };

      if (actionType === "APPROVE") {
        updateData.verificationStatus = "VERIFIED";
      } else if (actionType === "REJECT" || actionType === "MARK_SPAM") {
        updateData.verificationStatus = "REJECTED_SPAM";
      } else if (actionType === "MERGE_DUPLICATE" && mergeIntoReportId) {
        updateData.duplicateOfId = mergeIntoReportId;
        updateData.verificationStatus = "VERIFIED";
      }

      await prisma.report.update({
        where: { id: reportId },
        data: updateData,
      });

      // Record status history
      await prisma.reportStatusHistory.create({
        data: {
          reportId,
          actorId: session.id,
          previousStatus,
          newStatus,
          note: `Moderation action: ${actionType}${reason ? ` — ${reason}` : ""}`,
          isInternal: true,
        },
      });
    }

    // 3. Create verification request if applicable
    if (actionType === "REQUEST_INFO" && verificationRequestType) {
      await prisma.verificationRequest.create({
        data: {
          reportId,
          requestType: verificationRequestType,
          message: verificationMessage || "Please provide additional information about this report.",
          requestedBy: session.id,
          expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000), // 72 hours
        },
      });
    }

    // 4. Send notification to resident (neutral language — never say "AI detected fake")
    if (notificationTitle && actionType !== "FLAG_USER") {
      await prisma.notification.create({
        data: {
          userId: report.residentId,
          reportId,
          title: notificationTitle,
          message: notificationMessage,
          type: actionType === "REQUEST_INFO" ? "VERIFICATION_REQUEST" : "MODERATION",
        },
      });
    }

    // 5. Update user trust profile
    if (["APPROVE", "REJECT", "MARK_SPAM", "MERGE_DUPLICATE"].includes(actionType)) {
      await updateTrustAfterModeration(
        report.residentId,
        actionType as "APPROVE" | "REJECT" | "MARK_SPAM" | "MERGE_DUPLICATE"
      );
    }

    // 6. Audit log
    await createAuditLog({
      actorId: session.id,
      action: `MODERATION_${actionType}`,
      entity: "Report",
      entityId: reportId,
      previousState: { status: previousStatus, verificationStatus: report.verificationStatus },
      newState: { status: newStatus, actionType, flagType, reason },
      ipAddress: req.headers.get("x-forwarded-for") || "local",
    });

    return NextResponse.json({
      success: true,
      moderationAction,
      newStatus,
    });
  } catch (error: any) {
    console.error("Moderation action error:", error);
    return NextResponse.json({ error: error.message || "Failed to perform moderation action" }, { status: 500 });
  }
}
