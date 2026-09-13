import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      include: {
        defaultAgency: true,
      },
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Fetch categories error:", error);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || !isAdmin(session.role)) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const data = await req.json();
    const { name, description, icon, defaultPriority, defaultAgencyId, sortOrder } = data;

    if (!name || !description) {
      return NextResponse.json({ error: "Name and description are required" }, { status: 400 });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        description,
        icon: icon || "AlertTriangle",
        defaultPriority: defaultPriority || "MEDIUM",
        defaultAgencyId: defaultAgencyId || null,
        sortOrder: sortOrder || 0,
      },
      include: {
        defaultAgency: true,
      },
    });

    await createAuditLog({
      actorId: session.id,
      action: "CATEGORY_CREATED",
      entity: "Category",
      entityId: category.id,
      newState: category,
    });

    return NextResponse.json({ category });
  } catch (error: any) {
    console.error("Create category error:", error);
    return NextResponse.json({ error: error.message || "Failed to create category" }, { status: 500 });
  }
}
