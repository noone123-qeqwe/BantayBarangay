import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  try {
    // Test DB connection with lightweight count
    await prisma.systemSetting.count();

    return NextResponse.json({
      status: "ok",
      service: "BantayBarangay API",
      database: "connected",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "degraded",
        database: "disconnected",
        error: "Database connectivity check failed",
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
