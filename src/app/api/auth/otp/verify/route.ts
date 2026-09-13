import { NextRequest, NextResponse } from "next/server";
import { verifyOtp, OtpPurpose } from "@/lib/otp";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, code, purpose } = body;

    if (!phone || !code) {
      return NextResponse.json(
        { error: "Phone number and 6-digit verification code are required." },
        { status: 400 }
      );
    }

    const validPurposes: OtpPurpose[] = ["REGISTRATION", "PASSWORD_RESET", "LOGIN"];
    const otpPurpose: OtpPurpose = validPurposes.includes(purpose) ? purpose : "REGISTRATION";

    const result = await verifyOtp(phone, code, otpPurpose);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }

    return NextResponse.json({
      success: true,
      verificationToken: result.verificationToken,
      message: "Mobile number verified successfully.",
    });
  } catch (error: any) {
    console.error("OTP verify route error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while verifying the code." },
      { status: 500 }
    );
  }
}
