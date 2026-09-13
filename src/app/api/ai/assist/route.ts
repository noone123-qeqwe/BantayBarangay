import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { assistWriteReportWithAI } from "@/lib/aiService";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { problem, location, dangerOrDifficulty, duration, language } = body;

    if (!problem || !problem.trim()) {
      return NextResponse.json(
        { error: "Please provide what problem you observed." },
        { status: 400 }
      );
    }

    const preferredLang = language || (user as any)?.preferredLanguage || undefined;

    const refinedDescription = await assistWriteReportWithAI(
      {
        problem: problem.trim(),
        location: location?.trim() || "",
        dangerOrDifficulty: dangerOrDifficulty?.trim() || "",
        duration: duration?.trim() || "",
      },
      preferredLang
    );

    return NextResponse.json({
      success: true,
      description: refinedDescription,
    });
  } catch (error: any) {
    console.error("AI writing assistance error:", error);
    return NextResponse.json(
      { error: "Failed to generate report description" },
      { status: 500 }
    );
  }
}
