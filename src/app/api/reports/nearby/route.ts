import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("categoryId");
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");

    const whereClause: any = {};

    if (categoryId && categoryId !== "ALL") {
      whereClause.categoryId = categoryId;
    }

    if (status && status !== "ALL") {
      whereClause.status = status;
    }

    if (priority && priority !== "ALL") {
      whereClause.priority = priority;
    }

    // Return sanitized reports for public map without reporter PII
    const reports = await prisma.report.findMany({
      where: whereClause,
      select: {
        id: true,
        referenceNo: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        safetyFlag: true,
        latitude: true,
        longitude: true,
        accuracy: true,
        locationSource: true,
        locationCapturedAt: true,
        address: true,
        landmark: true,
        createdAt: true,
        category: {
          select: { id: true, name: true, icon: true },
        },
        assignedAgency: {
          select: { id: true, name: true, code: true },
        },
        photos: {
          select: { id: true, photoUrl: true, photoType: true, caption: true },
          take: 2,
        },
      },
      take: 200,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ reports });
  } catch (error: any) {
    console.error("Nearby reports error:", error);
    return NextResponse.json({ error: "Failed to fetch map reports" }, { status: 500 });
  }
}
