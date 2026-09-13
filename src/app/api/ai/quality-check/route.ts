import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { checkReportQuality } from "@/lib/aiService";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(); // optional

    const body = await req.json();
    const { categorySelected, description, hasPhoto, hasLocation } = body;

    const qualityResult = checkReportQuality({
      categorySelected: Boolean(categorySelected),
      description: description || "",
      hasPhoto: Boolean(hasPhoto),
      hasLocation: Boolean(hasLocation),
    });

    return NextResponse.json({
      success: true,
      quality: qualityResult,
    });
  } catch (error: any) {
    console.error("AI quality check error:", error);
    return NextResponse.json(
      { error: "Quality check failed" },
      { status: 500 }
    );
  }
}
