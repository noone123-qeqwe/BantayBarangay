import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentUser, isStaffOrAdmin } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getCurrentUser();

    const report = await prisma.report.findFirst({
      where: {
        OR: [{ id }, { referenceNo: id }],
      },
      include: {
        category: true,
        assignedAgency: true,
        assignedStaff: {
          select: { id: true, name: true, email: true },
        },
        photos: {
          orderBy: { createdAt: "desc" },
        },
        statusHistory: {
          include: {
            actor: {
              select: { id: true, name: true, role: true },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        updates: {
          include: {
            author: {
              select: { id: true, name: true, role: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        resident: {
          select: { id: true, name: true, email: true, phone: true },
        },
        // Anti-abuse data (filtered in response)
        riskAssessment: true,
        moderationActions: {
          orderBy: { createdAt: "desc" },
        },
        verificationRequests: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    const isStaff = session && isStaffOrAdmin(session.role);
    const isOwner = session && session.id === report.residentId;

    // Filter out internal notes for non-staff
    const sanitizedHistory = report.statusHistory.filter((item) => {
      if (isStaff) return true;
      return !item.isInternal;
    });

    const sanitizedUpdates = report.updates.filter((item) => {
      if (isStaff) return true;
      return !item.isInternal;
    });

    // Mask resident information if viewer is neither owner nor staff
    const sanitizedResident = (isStaff || isOwner) ? report.resident : null;

    // Risk data: only expose to staff, never to residents
    const riskAssessment = isStaff ? (report.riskAssessment ? {
      ...report.riskAssessment,
      signals: (() => {
        if (!report.riskAssessment.signals) return [];
        try {
          return JSON.parse(report.riskAssessment.signals);
        } catch {
          return [report.riskAssessment.signals];
        }
      })(),
    } : null) : undefined;
    const moderationActions = isStaff ? report.moderationActions : undefined;

    // Verification requests: visible to owner AND staff
    const verificationRequests = (isStaff || isOwner)
      ? report.verificationRequests.filter((vr) => {
          // For residents, only show pending/responded requests
          if (isStaff) return true;
          return vr.status === "PENDING" || vr.status === "RESPONDED";
        })
      : undefined;

    // For residents: don't expose risk fields
    const reportResponse: any = {
      ...report,
      resident: sanitizedResident,
      statusHistory: sanitizedHistory,
      updates: sanitizedUpdates,
      riskAssessment,
      moderationActions,
      verificationRequests,
    };

    // Strip risk internals from non-staff responses
    if (!isStaff) {
      delete reportResponse.riskScore;
      delete reportResponse.riskLevel;
      delete reportResponse.verificationStatus;
      delete reportResponse.riskAssessment;
      delete reportResponse.moderationActions;
    }

    return NextResponse.json({ report: reportResponse });
  } catch (error: any) {
    console.error("Fetch report detail error:", error);
    return NextResponse.json({ error: "Failed to load report" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getCurrentUser();
    if (!session || !isStaffOrAdmin(session.role)) {
      return NextResponse.json({ error: "Forbidden: Staff access required" }, { status: 403 });
    }

    const report = await prisma.report.findFirst({
      where: { OR: [{ id }, { referenceNo: id }] },
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    const body = await req.json();
    const { priority, assignedAgencyId, assignedStaffId, slaDeadline } = body;

    const previousState = {
      priority: report.priority,
      assignedAgencyId: report.assignedAgencyId,
      assignedStaffId: report.assignedStaffId,
    };

    const updated = await prisma.report.update({
      where: { id: report.id },
      data: {
        priority: priority || undefined,
        assignedAgencyId: assignedAgencyId !== undefined ? assignedAgencyId : undefined,
        assignedStaffId: assignedStaffId !== undefined ? assignedStaffId : undefined,
        slaDeadline: slaDeadline ? new Date(slaDeadline) : undefined,
      },
      include: {
        category: true,
        assignedAgency: true,
        assignedStaff: true,
      },
    });

    await createAuditLog({
      actorId: session.id,
      action: "REPORT_UPDATED",
      entity: "Report",
      entityId: report.id,
      previousState,
      newState: {
        priority: updated.priority,
        assignedAgencyId: updated.assignedAgencyId,
        assignedStaffId: updated.assignedStaffId,
      },
    });

    // Notify resident of assignment/priority adjustment if changed
    if (assignedAgencyId && assignedAgencyId !== report.assignedAgencyId) {
      await prisma.notification.create({
        data: {
          userId: report.residentId,
          reportId: report.id,
          title: "Agency Assigned",
          message: `Your report ${report.referenceNo} has been assigned to ${updated.assignedAgency?.name || "the responsible agency"}.`,
          type: "ASSIGNMENT",
        },
      });
    }

    return NextResponse.json({ report: updated });
  } catch (error: any) {
    console.error("Update report error:", error);
    return NextResponse.json({ error: error.message || "Failed to update report" }, { status: 500 });
  }
}
