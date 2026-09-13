import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentUser();
    if (!session || !["ADMIN", "SUPER_ADMIN", "STAFF"].includes(session.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const entry = await (prisma as any).masbatenoGlossary.findUnique({
      where: { id },
      include: {
        auditLogs: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!entry) {
      return NextResponse.json({ error: "Translation entry not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, entry });
  } catch (error: any) {
    console.error("Error retrieving glossary entry:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentUser();
    if (!session || !["ADMIN", "SUPER_ADMIN", "STAFF"].includes(session.role)) {
      return NextResponse.json({ error: "Forbidden: Admin or Staff access required" }, { status: 403 });
    }

    const { id } = await params;
    const existing = await (prisma as any).masbatenoGlossary.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Translation entry not found" }, { status: 404 });
    }

    const body = await req.json();
    const {
      masbateno,
      filipino,
      english,
      category,
      contextOrNotes,
      status,
      isActive,
      note,
    } = body;

    const previousState = JSON.stringify(existing);

    const updated = await (prisma as any).masbatenoGlossary.update({
      where: { id },
      data: {
        ...(masbateno !== undefined ? { masbateno: masbateno.trim() } : {}),
        ...(filipino !== undefined ? { filipino: filipino.trim() } : {}),
        ...(english !== undefined ? { english: english.trim() } : {}),
        ...(category !== undefined ? { category } : {}),
        ...(contextOrNotes !== undefined ? { contextOrNotes: contextOrNotes?.trim() || null } : {}),
        ...(status !== undefined ? { status } : {}),
        ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
        updatedById: session.id,
      },
    });

    const newState = JSON.stringify(updated);

    // Create audit log
    await (prisma as any).masbatenoLanguageAudit.create({
      data: {
        glossaryId: id,
        actorId: session.id,
        actorName: session.name,
        changeType: status !== existing.status ? "STATUS_CHANGE" : isActive !== existing.isActive ? "TOGGLE_ACTIVE" : "UPDATE",
        previousState,
        newState,
        note: note || `Updated by ${session.name}`,
      },
    });

    return NextResponse.json({ success: true, entry: updated });
  } catch (error: any) {
    console.error("Error updating glossary entry:", error);
    return NextResponse.json({ error: "Failed to update glossary entry" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentUser();
    if (!session || !["ADMIN", "SUPER_ADMIN"].includes(session.role)) {
      return NextResponse.json({ error: "Forbidden: Administrator role required" }, { status: 403 });
    }

    const { id } = await params;
    const existing = await (prisma as any).masbatenoGlossary.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    // Soft toggle or delete
    const toggled = await (prisma as any).masbatenoGlossary.update({
      where: { id },
      data: {
        isActive: false,
        updatedById: session.id,
      },
    });

    await (prisma as any).masbatenoLanguageAudit.create({
      data: {
        glossaryId: id,
        actorId: session.id,
        actorName: session.name,
        changeType: "TOGGLE_ACTIVE",
        previousState: JSON.stringify(existing),
        newState: JSON.stringify(toggled),
        note: `Disabled by ${session.name}`,
      },
    });

    return NextResponse.json({ success: true, message: "Translation disabled successfully", entry: toggled });
  } catch (error: any) {
    console.error("Error disabling glossary entry:", error);
    return NextResponse.json({ error: "Failed to disable glossary entry" }, { status: 500 });
  }
}
