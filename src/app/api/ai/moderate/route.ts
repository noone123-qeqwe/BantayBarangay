import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { moderateReportWithAI } from "@/lib/aiService";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { description, categorySlug, categoryName, photoUrls } = body;

    if (!description || !categorySlug) {
      return NextResponse.json(
        { error: "Description and categorySlug are required" },
        { status: 400 }
      );
    }

    const moderation = await moderateReportWithAI({
      description,
      categorySlug,
      categoryName: categoryName || categorySlug,
      photoUrls: photoUrls || [],
    });

    return NextResponse.json({
      success: true,
      moderation,
    });
  } catch (error: any) {
    console.error("AI moderation error:", error);
    return NextResponse.json(
      { error: "AI moderation service encountered an error" },
      { status: 500 }
    );
  }
}
