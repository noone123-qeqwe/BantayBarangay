import { NextRequest, NextResponse } from "next/server";
import { requestOtp, OtpPurpose } from "@/lib/otp";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, purpose } = body;

    if (!phone) {
      return NextResponse.json(
        { error: "Mobile phone number is required." },
        { status: 400 }
      );
    }

    const validPurposes: OtpPurpose[] = ["REGISTRATION", "PASSWORD_RESET", "LOGIN"];
    const otpPurpose: OtpPurpose = validPurposes.includes(purpose) ? purpose : "REGISTRATION";

    const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "local";

    const result = await requestOtp(phone, otpPurpose, ipAddress);

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error,
          cooldownSeconds: result.cooldownSeconds,
        },
        { status: result.status }
      );
    }

    return NextResponse.json({
      success: true,
      maskedPhone: result.maskedPhone,
      cooldownSeconds: result.cooldownSeconds,
      expiresInSeconds: result.expiresInSeconds,
      ...(result.devCode ? { devCode: result.devCode } : {}),
    });
  } catch (error: any) {
    console.error("OTP send route error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while sending the verification code." },
      { status: 500 }
    );
  }
}
