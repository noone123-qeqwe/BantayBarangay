import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentUser, isStaffOrAdmin } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getCurrentUser();

    if (!session || !isStaffOrAdmin(session.role)) {
      return NextResponse.json(
        { error: "Forbidden: Only authorized personnel can update report status" },
        { status: 403 }
      );
    }

    const report = await prisma.report.findFirst({
      where: { OR: [{ id }, { referenceNo: id }] },
      include: { resident: true },
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    const { newStatus, note, isInternal = false, photoUrl } = await req.json();

    if (!newStatus) {
      return NextResponse.json({ error: "New status is required" }, { status: 400 });
    }

    // Validation for RESOLVED status: require resolution note
    if (newStatus === "RESOLVED" && (!note || note.trim().length < 5)) {
      return NextResponse.json(
        { error: "Please provide a detailed resolution note explaining the fix." },
        { status: 400 }
      );
    }

    const previousStatus = report.status;
    const updateData: any = {
      status: newStatus,
    };

    if (newStatus === "RESOLVED") {
      updateData.resolvedAt = new Date();
    } else if (newStatus === "CLOSED") {
      updateData.closedAt = new Date();
    }

    // Update report
    const updatedReport = await prisma.report.update({
      where: { id: report.id },
      data: updateData,
    });

    // Record status history event
    await prisma.reportStatusHistory.create({
      data: {
        reportId: report.id,
        actorId: session.id,
        previousStatus,
        newStatus,
        note: note || `Status changed to ${newStatus}`,
        isInternal: Boolean(isInternal),
        photoUrl: photoUrl || null,
      },
    });

    // If resolution photo provided, attach to photos table as RESOLUTION
    if (photoUrl) {
      await prisma.reportPhoto.create({
        data: {
          reportId: report.id,
          photoUrl,
          photoType: newStatus === "RESOLVED" ? "RESOLUTION" : "IN_PROGRESS",
          caption: note || `Photo for status ${newStatus}`,
          uploadedByUserId: session.id,
        },
      });
    }

    // Notify resident if not internal note
    if (!isInternal) {
      let notifTitle = `Report ${newStatus.replace("_", " ")}`;
      let notifMessage = `Your report ${report.referenceNo} is now ${newStatus.replace("_", " ")}.`;

      if (newStatus === "RESOLVED") {
        notifTitle = "Issue Marked as Resolved — Verification Required";
        notifMessage = `Work has finished on report ${report.referenceNo}. Please verify if the problem is fixed!`;
      } else if (newStatus === "IN_PROGRESS") {
        notifTitle = "Work In Progress";
        notifMessage = `Responders have commenced repair work on report ${report.referenceNo}.`;
      }

      await prisma.notification.create({
        data: {
          userId: report.residentId,
          reportId: report.id,
          title: notifTitle,
          message: notifMessage,
          type: newStatus === "RESOLVED" ? "RESOLUTION" : "STATUS_CHANGE",
        },
      });
    }

    // Write audit log
    await createAuditLog({
      actorId: session.id,
      action: "STATUS_CHANGED",
      entity: "Report",
      entityId: report.id,
      previousState: { status: previousStatus },
      newState: { status: newStatus, note, isInternal },
    });

    return NextResponse.json({ report: updatedReport });
  } catch (error: any) {
    console.error("Status update error:", error);
    return NextResponse.json({ error: error.message || "Failed to update status" }, { status: 500 });
  }
}
