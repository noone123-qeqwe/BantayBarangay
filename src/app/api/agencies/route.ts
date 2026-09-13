import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";

export async function GET() {
  try {
    const agencies = await prisma.agency.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ agencies });
  } catch (error) {
    console.error("Fetch agencies error:", error);
    return NextResponse.json({ error: "Failed to fetch agencies" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || !isAdmin(session.role)) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { name, code, description, contactEmail, contactPhone, coverageArea } = await req.json();

    if (!name || !code || !description) {
      return NextResponse.json({ error: "Name, code, and description are required" }, { status: 400 });
    }

    const agency = await prisma.agency.create({
      data: {
        name,
        code: code.toUpperCase().trim(),
        description,
        contactEmail,
        contactPhone,
        coverageArea,
      },
    });

    await createAuditLog({
      actorId: session.id,
      action: "AGENCY_CREATED",
      entity: "Agency",
      entityId: agency.id,
      newState: agency,
    });

    return NextResponse.json({ agency });
  } catch (error: any) {
    console.error("Create agency error:", error);
    return NextResponse.json({ error: error.message || "Failed to create agency" }, { status: 500 });
  }
}
