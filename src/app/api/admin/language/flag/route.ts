import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || !["ADMIN", "SUPER_ADMIN", "STAFF"].includes(session.role)) {
      return NextResponse.json({ error: "Forbidden: Admin or Staff reviewer access required" }, { status: 403 });
    }

    const body = await req.json();
    const { glossaryId, status, note } = body;

    const validStatuses = ["VERIFIED", "NEEDS_REVIEW", "INCORRECT", "UNNATURAL", "UNCERTAIN"];
    if (!glossaryId || !status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid payload. Status must be one of: ${validStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    const existing = await (prisma as any).masbatenoGlossary.findUnique({
      where: { id: glossaryId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Translation entry not found" }, { status: 404 });
    }

    const previousState = JSON.stringify(existing);

    const updated = await (prisma as any).masbatenoGlossary.update({
      where: { id: glossaryId },
      data: {
        status,
        updatedById: session.id,
      },
    });

    // Record human review audit
    await (prisma as any).masbatenoLanguageAudit.create({
      data: {
        glossaryId,
        actorId: session.id,
        actorName: session.name,
        changeType: "HUMAN_REVIEW_FLAG",
        previousState,
        newState: JSON.stringify(updated),
        note: note ? `Flagged as [${status}]: ${note}` : `Flagged as [${status}] by reviewer ${session.name}`,
      },
    });

    return NextResponse.json({
      success: true,
      entry: updated,
      message: `Term '${existing.term}' successfully marked as ${status}`,
    });
  } catch (error: any) {
    console.error("Error flagging translation:", error);
    return NextResponse.json({ error: "Failed to record human review flag" }, { status: 500 });
  }
}
