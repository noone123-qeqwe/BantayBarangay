import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { seedDefaultGlossaryIfEmpty } from "@/lib/languages/masbatenoGlossary";

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || !["ADMIN", "SUPER_ADMIN", "STAFF"].includes(session.role)) {
      return NextResponse.json({ error: "Forbidden: Admin or Staff access required" }, { status: 403 });
    }

    // Auto-seed if empty
    await seedDefaultGlossaryIfEmpty();

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const status = searchParams.get("status");
    const activeParam = searchParams.get("isActive");
    const search = searchParams.get("search");

    const where: any = {};

    if (category && category !== "ALL") {
      where.category = category;
    }

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (activeParam !== null && activeParam !== undefined && activeParam !== "ALL") {
      where.isActive = activeParam === "true";
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { term: { contains: q } },
        { masbateno: { contains: q } },
        { filipino: { contains: q } },
        { english: { contains: q } },
        { contextOrNotes: { contains: q } },
      ];
    }

    const [entries, totalCount, verifiedCount, needsReviewCount, uncertainCount, unnaturalCount, incorrectCount, activeCount] = await Promise.all([
      (prisma as any).masbatenoGlossary.findMany({
        where,
        orderBy: [{ category: "asc" }, { term: "asc" }],
      }),
      (prisma as any).masbatenoGlossary.count(),
      (prisma as any).masbatenoGlossary.count({ where: { status: "VERIFIED" } }),
      (prisma as any).masbatenoGlossary.count({ where: { status: "NEEDS_REVIEW" } }),
      (prisma as any).masbatenoGlossary.count({ where: { status: "UNCERTAIN" } }),
      (prisma as any).masbatenoGlossary.count({ where: { status: "UNNATURAL" } }),
      (prisma as any).masbatenoGlossary.count({ where: { status: "INCORRECT" } }),
      (prisma as any).masbatenoGlossary.count({ where: { isActive: true } }),
    ]);

    return NextResponse.json({
      success: true,
      entries,
      stats: {
        total: totalCount,
        verified: verifiedCount,
        needsReview: needsReviewCount,
        uncertain: uncertainCount,
        unnatural: unnaturalCount,
        incorrect: incorrectCount,
        active: activeCount,
      },
    });
  } catch (error: any) {
    console.error("Error fetching Masbateño glossary:", error);
    return NextResponse.json({ error: "Failed to fetch glossary entries" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || !["ADMIN", "SUPER_ADMIN", "STAFF"].includes(session.role)) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const { term, category, masbateno, filipino, english, contextOrNotes, status = "VERIFIED", isActive = true } = body;

    if (!term || !masbateno || !filipino || !english || !category) {
      return NextResponse.json(
        { error: "Term, Category, Masbateño, Filipino, and English translations are required." },
        { status: 400 }
      );
    }

    const normalizedTerm = term.trim().toLowerCase().replace(/\s+/g, "_");

    // Check duplicate
    const existing = await (prisma as any).masbatenoGlossary.findUnique({
      where: { term: normalizedTerm },
    });

    if (existing) {
      return NextResponse.json(
        { error: `A translation entry with term identifier '${normalizedTerm}' already exists.` },
        { status: 409 }
      );
    }

    const newEntry = await (prisma as any).masbatenoGlossary.create({
      data: {
        term: normalizedTerm,
        category,
        masbateno: masbateno.trim(),
        filipino: filipino.trim(),
        english: english.trim(),
        contextOrNotes: contextOrNotes?.trim() || null,
        status,
        isActive: Boolean(isActive),
        createdById: session.id,
        updatedById: session.id,
      },
    });

    // Audit log
    await (prisma as any).masbatenoLanguageAudit.create({
      data: {
        glossaryId: newEntry.id,
        actorId: session.id,
        actorName: session.name,
        changeType: "CREATE",
        previousState: null,
        newState: JSON.stringify(newEntry),
        note: `Initial entry added by ${session.name}`,
      },
    });

    return NextResponse.json({
      success: true,
      entry: newEntry,
    }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating glossary entry:", error);
    return NextResponse.json({ error: "Failed to create glossary entry" }, { status: 500 });
  }
}
