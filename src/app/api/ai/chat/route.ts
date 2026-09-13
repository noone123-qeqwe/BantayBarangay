import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { civicChatWithAI } from "@/lib/aiService";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    // Allow resident or guest asking about platform features
    const body = await req.json();
    const { messages, language } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Conversation messages array is required" },
        { status: 400 }
      );
    }

    // Resolve language from explicit payload or authenticated user preference
    const preferredLang = language || (user as any)?.preferredLanguage || undefined;

    const reply = await civicChatWithAI(messages, preferredLang);

    return NextResponse.json({
      success: true,
      reply,
    });
  } catch (error: any) {
    console.error("Civic chat assistant error:", error);
    return NextResponse.json({
      success: true,
      reply: "I am your BantayBarangay civic guide. You can ask me how to file a report, how to track existing repairs, or how to contact barangay public safety offices.",
    });
  }
}
