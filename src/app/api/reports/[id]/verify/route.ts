import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getCurrentUser();

    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const report = await prisma.report.findFirst({
      where: { OR: [{ id }, { referenceNo: id }] },
      include: { assignedStaff: true },
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // Only the reporting resident or admin can verify resolution
    if (report.residentId !== session.id && session.role !== "ADMIN" && session.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Only the original reporter can verify resolution." },
        { status: 403 }
      );
    }

    const { confirmed, reason } = await req.json();

    if (confirmed) {
      // Confirmed fixed -> Close report
      const updated = await prisma.report.update({
        where: { id: report.id },
        data: {
          status: "CLOSED",
          closedAt: new Date(),
        },
      });

      await prisma.reportStatusHistory.create({
        data: {
          reportId: report.id,
          actorId: session.id,
          previousStatus: report.status,
          newStatus: "CLOSED",
          note: reason || "Resident confirmed: Yes, the issue has been successfully resolved and fixed.",
          isInternal: false,
        },
      });

      // Notify staff
      if (report.assignedStaffId) {
        await prisma.notification.create({
          data: {
            userId: report.assignedStaffId,
            reportId: report.id,
            title: "Report Closed & Verified",
            message: `Resident confirmed fix for report ${report.referenceNo}. Case closed.`,
            type: "RESOLUTION",
          },
        });
      }

      await createAuditLog({
        actorId: session.id,
        action: "RESOLUTION_VERIFIED_FIXED",
        entity: "Report",
        entityId: report.id,
        previousState: { status: report.status },
        newState: { status: "CLOSED" },
      });

      return NextResponse.json({ report: updated, message: "Thank you for confirming resolution!" });
    } else {
      // Problem remains -> Reopen report
      const updated = await prisma.report.update({
        where: { id: report.id },
        data: {
          status: "REOPENED",
        },
      });

      await prisma.reportStatusHistory.create({
        data: {
          reportId: report.id,
          actorId: session.id,
          previousStatus: report.status,
          newStatus: "REOPENED",
          note: reason ? `Resident indicated problem remains: "${reason}"` : "Resident indicated problem is not yet resolved.",
          isInternal: false,
        },
      });

      // Notify assigned staff / staff team of reopening
      const recipients = report.assignedStaffId
        ? [{ id: report.assignedStaffId }]
        : await prisma.user.findMany({
            where: { role: "STAFF", isActive: true },
            select: { id: true },
          });

      for (const staff of recipients) {
        await prisma.notification.create({
          data: {
            userId: staff.id,
            reportId: report.id,
            title: "Report Reopened by Resident",
            message: `Report ${report.referenceNo} was reopened. Reason: "${reason || "Problem remains"}"`,
            type: "STATUS_CHANGE",
          },
        });
      }

      await createAuditLog({
        actorId: session.id,
        action: "RESOLUTION_REOPENED",
        entity: "Report",
        entityId: report.id,
        previousState: { status: report.status },
        newState: { status: "REOPENED", reason },
      });

      return NextResponse.json({ report: updated, message: "Report reopened for additional review." });
    }
  } catch (error: any) {
    console.error("Verification error:", error);
    return NextResponse.json({ error: error.message || "Failed to submit verification" }, { status: 500 });
  }
}
