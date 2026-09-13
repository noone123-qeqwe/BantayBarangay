import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentUser, isStaffOrAdmin } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import { recordModerationOutcome } from "@/lib/userTrust";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentUser();
    if (!session || !isStaffOrAdmin(session.role)) {
      return NextResponse.json({ error: "Staff or Admin authorization required." }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { actionType, reason, flagType, message, duplicateOfId } = body;

    // Allowed action types
    const validActions = ["APPROVE", "REQUEST_INFO", "REJECT", "MARK_SPAM", "MERGE_DUPLICATE"];
    if (!validActions.includes(actionType)) {
      return NextResponse.json({ error: "Invalid moderation action type." }, { status: 400 });
    }

    // Lookup report
    const report = await prisma.report.findFirst({
      where: {
        OR: [{ id }, { referenceNo: id }],
      },
      include: {
        resident: true,
      },
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found." }, { status: 404 });
    }

    const prevStatus = report.status;
    let newStatus = report.status;
    let newVerificationStatus = report.verificationStatus;

    if (actionType === "APPROVE") {
      newVerificationStatus = "VERIFIED";
      if (report.status === "PENDING_VERIFICATION" || report.status === "SUBMITTED") {
        newStatus = "UNDER_REVIEW";
      }
      await recordModerationOutcome({
        userId: report.residentId,
        reportId: report.id,
        action: "APPROVE",
        moderatorId: session.id,
      });
    } else if (actionType === "REQUEST_INFO") {
      // Create verification request record
      await prisma.verificationRequest.create({
        data: {
          reportId: report.id,
          requestType: "ADD_DETAILS",
          message: message || "Please provide additional photos or details to help municipal work crews locate and resolve this issue.",
          requestedBy: session.id,
          status: "PENDING",
        },
      });

      // Notify resident
      await prisma.notification.create({
        data: {
          userId: report.residentId,
          reportId: report.id,
          title: `Action Needed: Report ${report.referenceNo}`,
          message: message || "Barangay staff requested additional details regarding your report.",
          type: "VERIFICATION_REQUEST",
        },
      });
    } else if (actionType === "REJECT") {
      newStatus = "REJECTED";
      await recordModerationOutcome({
        userId: report.residentId,
        reportId: report.id,
        action: "REJECT",
        flagType: flagType || "OTHER",
        reason: reason || "Report rejected following staff review.",
        moderatorId: session.id,
      });
    } else if (actionType === "MARK_SPAM") {
      newStatus = "REJECTED";
      newVerificationStatus = "REJECTED_SPAM";
      await recordModerationOutcome({
        userId: report.residentId,
        reportId: report.id,
        action: "MARK_SPAM",
        flagType: "SPAM",
        reason: reason || "Report identified as spam/prank.",
        moderatorId: session.id,
      });
    } else if (actionType === "MERGE_DUPLICATE") {
      newStatus = "CLOSED";
      if (duplicateOfId) {
        await prisma.report.update({
          where: { id: report.id },
          data: { duplicateOfId },
        });
      }
      await recordModerationOutcome({
        userId: report.residentId,
        reportId: report.id,
        action: "MERGE_DUPLICATE",
        flagType: "DUPLICATE",
        reason: reason || "Linked and merged with existing nearby report.",
        moderatorId: session.id,
      });
    }

    // Update report
    const updatedReport = await prisma.report.update({
      where: { id: report.id },
      data: {
        status: newStatus,
        verificationStatus: newVerificationStatus,
      },
    });

    // Record moderation action log
    await prisma.moderationAction.create({
      data: {
        reportId: report.id,
        moderatorId: session.id,
        actionType,
        flagType: flagType || null,
        reason: reason || message || `Action ${actionType} performed by staff.`,
        previousStatus: prevStatus,
        newStatus,
      },
    });

    // Record status history if status changed
    if (newStatus !== prevStatus) {
      await prisma.reportStatusHistory.create({
        data: {
          reportId: report.id,
          actorId: session.id,
          previousStatus: prevStatus,
          newStatus,
          note: reason || `Report status updated to ${newStatus} via moderation action.`,
          isInternal: false,
        },
      });
    }

    // Audit log
    await createAuditLog({
      actorId: session.id,
      action: `REPORT_MODERATION_${actionType}`,
      entity: "Report",
      entityId: report.id,
      previousState: { status: prevStatus, verificationStatus: report.verificationStatus },
      newState: { status: newStatus, verificationStatus: newVerificationStatus },
    });

    return NextResponse.json({
      success: true,
      report: updatedReport,
      actionType,
    });
  } catch (error: any) {
    console.error("Staff moderation action error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to execute moderation action." },
      { status: 500 }
    );
  }
}
