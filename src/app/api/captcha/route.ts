import { NextRequest, NextResponse } from "next/server";
import { generateChallenge, verifyChallenge } from "@/lib/captchaChallenge";

/**
 * GET /api/captcha — Generate a new CAPTCHA challenge
 */
export async function GET() {
  try {
    const challenge = generateChallenge();
    return NextResponse.json(challenge);
  } catch (error: any) {
    console.error("CAPTCHA generation error:", error);
    return NextResponse.json({ error: "Failed to generate challenge" }, { status: 500 });
  }
}

/**
 * POST /api/captcha — Verify a CAPTCHA answer
 */
export async function POST(req: NextRequest) {
  try {
    const { token, answer } = await req.json();

    if (!token || answer === undefined || answer === null) {
      return NextResponse.json({ error: "Token and answer are required" }, { status: 400 });
    }

    const result = verifyChallenge(token, parseInt(String(answer), 10));

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("CAPTCHA verification error:", error);
    return NextResponse.json({ error: "Failed to verify challenge" }, { status: 500 });
  }
}
