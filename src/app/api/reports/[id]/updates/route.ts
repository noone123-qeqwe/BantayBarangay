import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentUser, isStaffOrAdmin } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getCurrentUser();

    if (!session || !isStaffOrAdmin(session.role)) {
      return NextResponse.json(
        { error: "Forbidden: Only staff and administrators can post operational updates." },
        { status: 403 }
      );
    }

    const report = await prisma.report.findFirst({
      where: { OR: [{ id }, { referenceNo: id }] },
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    const { message, isInternal = false } = await req.json();

    if (!message || message.trim().length === 0) {
      return NextResponse.json({ error: "Message cannot be empty" }, { status: 400 });
    }

    const update = await prisma.reportUpdate.create({
      data: {
        reportId: report.id,
        authorId: session.id,
        message: message.trim(),
        isInternal: Boolean(isInternal),
      },
      include: {
        author: {
          select: { id: true, name: true, role: true },
        },
      },
    });

    // If public update, notify the reporting resident
    if (!isInternal) {
      await prisma.notification.create({
        data: {
          userId: report.residentId,
          reportId: report.id,
          title: "New Public Update",
          message: `Staff posted an update on report ${report.referenceNo}: "${message.slice(0, 80)}..."`,
          type: "UPDATE",
        },
      });
    }

    return NextResponse.json({ update }, { status: 201 });
  } catch (error: any) {
    console.error("Post update error:", error);
    return NextResponse.json({ error: error.message || "Failed to post update" }, { status: 500 });
  }
}
