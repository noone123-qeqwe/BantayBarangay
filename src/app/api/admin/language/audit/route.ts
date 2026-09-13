import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || !["ADMIN", "SUPER_ADMIN", "STAFF"].includes(session.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const glossaryId = searchParams.get("glossaryId");
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const where: any = {};
    if (glossaryId) {
      where.glossaryId = glossaryId;
    }

    const logs = await (prisma as any).masbatenoLanguageAudit.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        glossary: {
          select: {
            id: true,
            term: true,
            category: true,
            masbateno: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, logs });
  } catch (error: any) {
    console.error("Error retrieving language audit logs:", error);
    return NextResponse.json({ error: "Failed to fetch language audit history" }, { status: 500 });
  }
}
