import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import { consumeVerificationToken } from "@/lib/otp";

export async function POST(req: NextRequest) {
  try {
    const { verificationToken, newPassword } = await req.json();

    if (!verificationToken || !newPassword) {
      return NextResponse.json(
        { error: "Verification token and new password are required." },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "New password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    const now = new Date();

    // 1. Verify single-use reset token
    const otpRecord = await prisma.otpVerification.findUnique({
      where: { verificationToken },
    });

    if (
      !otpRecord ||
      otpRecord.purpose !== "PASSWORD_RESET" ||
      !otpRecord.tokenExpiresAt ||
      otpRecord.tokenExpiresAt <= now
    ) {
      return NextResponse.json(
        { error: "Password reset session has expired or is invalid. Please start again." },
        { status: 400 }
      );
    }

    // 2. Find target user by normalized phone
    const user = await prisma.user.findUnique({
      where: { phone: otpRecord.phone },
    });

    if (!user) {
      return NextResponse.json(
        { error: "No user account found matching this mobile number." },
        { status: 404 }
      );
    }

    // 3. Hash new password and update user record
    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    // 4. Invalidate reset token
    await consumeVerificationToken(otpRecord.id);

    // 5. Create audit log
    await createAuditLog({
      actorId: user.id,
      action: "PASSWORD_RESET",
      entity: "User",
      entityId: user.id,
      newState: { phone: user.phone, resetVia: "SMS_OTP" },
      ipAddress: req.headers.get("x-forwarded-for") || "local",
    });

    return NextResponse.json({
      success: true,
      message: "Password reset successfully. You can now log in with your new password.",
    });
  } catch (error: any) {
    console.error("Password reset error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while resetting your password." },
      { status: 500 }
    );
  }
}
