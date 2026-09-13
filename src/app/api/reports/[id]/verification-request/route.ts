import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentUser, isStaffOrAdmin } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";

/**
 * GET /api/reports/[id]/verification-request
 * Resident can view pending verification requests for their report.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const report = await prisma.report.findFirst({
      where: { OR: [{ id }, { referenceNo: id }] },
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // Allow access to report owner or staff
    const isOwner = session.id === report.residentId;
    const isStaff = isStaffOrAdmin(session.role);
    if (!isOwner && !isStaff) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const requests = await prisma.verificationRequest.findMany({
      where: { reportId: report.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ verificationRequests: requests });
  } catch (error: any) {
    console.error("Verification request fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch verification requests" }, { status: 500 });
  }
}

/**
 * POST /api/reports/[id]/verification-request
 * Resident responds to a verification request.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const report = await prisma.report.findFirst({
      where: { OR: [{ id }, { referenceNo: id }] },
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    if (session.id !== report.residentId) {
      return NextResponse.json({ error: "Only the report owner can respond" }, { status: 403 });
    }

    const body = await req.json();
    const { requestId, response, responsePhotoUrl } = body;

    if (!requestId || !response) {
      return NextResponse.json(
        { error: "Request ID and response are required" },
        { status: 400 }
      );
    }

    const verificationRequest = await prisma.verificationRequest.findUnique({
      where: { id: requestId },
    });

    if (!verificationRequest || verificationRequest.reportId !== report.id) {
      return NextResponse.json({ error: "Verification request not found" }, { status: 404 });
    }

    if (verificationRequest.status !== "PENDING") {
      return NextResponse.json({ error: "This verification request has already been responded to" }, { status: 400 });
    }

    // Update verification request
    await prisma.verificationRequest.update({
      where: { id: requestId },
      data: {
        response: response.trim(),
        responsePhotoUrl: responsePhotoUrl || null,
        status: "RESPONDED",
        respondedAt: new Date(),
      },
    });

    // Add a report update visible to staff
    await prisma.reportUpdate.create({
      data: {
        reportId: report.id,
        authorId: session.id,
        message: `Verification response: ${response.trim()}`,
        isInternal: false,
      },
    });

    // Notify staff that resident responded
    const staffUsers = await prisma.user.findMany({
      where: { role: { in: ["STAFF", "ADMIN"] }, isActive: true },
      select: { id: true },
    });

    if (staffUsers.length > 0) {
      await prisma.notification.createMany({
        data: staffUsers.map((staff) => ({
          userId: staff.id,
          reportId: report.id,
          title: "Verification Response Received",
          message: `The resident has responded to the verification request for report ${report.referenceNo}.`,
          type: "VERIFICATION_REQUEST",
        })),
      });
    }

    // Audit log
    await createAuditLog({
      actorId: session.id,
      action: "VERIFICATION_RESPONDED",
      entity: "VerificationRequest",
      entityId: requestId,
      newState: { response: response.trim(), reportId: report.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Verification response error:", error);
    return NextResponse.json({ error: "Failed to submit verification response" }, { status: 500 });
  }
}
