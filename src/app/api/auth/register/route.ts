import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { hashPassword, signToken, COOKIE_NAME } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import { normalizePhoneNumber } from "@/lib/phone";
import { validateVerificationToken, consumeVerificationToken } from "@/lib/otp";

export async function POST(req: NextRequest) {
  try {
    const { name, phone, password, verificationToken, email, birthDate } = await req.json();

    if (!name || !phone || !password) {
      return NextResponse.json(
        { error: "Full name, mobile number, and password are required." },
        { status: 400 }
      );
    }

    if (!birthDate) {
      return NextResponse.json(
        { error: "Date of birth is required." },
        { status: 400 }
      );
    }

    // Validate Date of Birth and calculate age server-side
    const parsedBirthDate = new Date(birthDate);
    if (isNaN(parsedBirthDate.getTime())) {
      return NextResponse.json(
        { error: "Please provide a valid date of birth." },
        { status: 400 }
      );
    }

    const now = new Date();
    if (parsedBirthDate > now) {
      return NextResponse.json(
        { error: "Date of birth cannot be in the future." },
        { status: 400 }
      );
    }

    // Derive the exact age dynamically
    let computedAge = now.getFullYear() - parsedBirthDate.getFullYear();
    const monthDiff = now.getMonth() - parsedBirthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < parsedBirthDate.getDate())) {
      computedAge--;
    }

    if (computedAge < 0 || computedAge > 125) {
      return NextResponse.json(
        { error: "Please enter a realistic date of birth." },
        { status: 400 }
      );
    }

    const normalizedPhone = normalizePhoneNumber(phone);
    if (!normalizedPhone) {
      return NextResponse.json(
        { error: "Please provide a valid Philippine mobile number (09XXXXXXXXX or +639XXXXXXXXX)." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    // 1. Validate Single-Use OTP Verification Token
    if (!verificationToken) {
      return NextResponse.json(
        { error: "Please verify your mobile number with the SMS code before completing registration." },
        { status: 400 }
      );
    }

    const otpRecord = await validateVerificationToken(
      verificationToken,
      normalizedPhone,
      "REGISTRATION"
    );

    if (!otpRecord) {
      return NextResponse.json(
        { error: "Mobile number verification session expired or invalid. Please request a new verification code." },
        { status: 400 }
      );
    }

    // 2. Uniqueness check: Mobile phone
    const existingByPhone = await prisma.user.findUnique({
      where: { phone: normalizedPhone },
    });

    if (existingByPhone) {
      return NextResponse.json(
        { error: "Mobile number already registered. Please log in or use “Forgot Password.”" },
        { status: 400 }
      );
    }

    // 3. Optional Email check (only if user provided an optional email)
    let cleanEmail: string | null = null;
    if (email && typeof email === "string" && email.trim()) {
      cleanEmail = email.toLowerCase().trim();
      const existingByEmail = await prisma.user.findUnique({
        where: { email: cleanEmail },
      });
      if (existingByEmail) {
        return NextResponse.json(
          { error: "An account with this optional email already exists." },
          { status: 400 }
        );
      }
    }

    // 4. Create User
    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        birthDate: parsedBirthDate,
        age: computedAge,
        phone: normalizedPhone,
        email: cleanEmail,
        passwordHash,
        role: "RESIDENT",
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(normalizedPhone)}`,
      },
    });

    // 5. Invalidate verification token
    await consumeVerificationToken(otpRecord.id);

    // 6. Sign Session Token & Audit Log
    const token = signToken({
      id: user.id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      role: "RESIDENT",
      avatar: user.avatar,
    });

    await createAuditLog({
      actorId: user.id,
      action: "USER_REGISTERED",
      entity: "User",
      entityId: user.id,
      newState: {
        phone: user.phone,
        birthDate: user.birthDate,
        age: user.age,
        email: user.email,
        role: user.role,
      },
      ipAddress: req.headers.get("x-forwarded-for") || "local",
    });

    const response = NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        birthDate: user.birthDate,
        age: user.age,
        phone: user.phone,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    });

    const proto = req.headers.get("x-forwarded-proto") || req.nextUrl.protocol.replace(":", "");
    const isHttps = proto === "https";

    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: isHttps,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during registration." },
      { status: 500 }
    );
  }
}
