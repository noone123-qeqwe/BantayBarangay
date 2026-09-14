import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyPassword, signToken, COOKIE_NAME } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import { normalizePhoneNumber } from "@/lib/phone";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const identifier = (body.phone || body.identifier || body.email || "").trim();
    const password = body.password;

    if (!identifier || !password) {
      return NextResponse.json(
        { error: "Mobile number (or email) and password are required." },
        { status: 400 }
      );
    }

    let user = null;

    // Check if the identifier is a valid Philippine mobile number format
    const normalizedPhone = normalizePhoneNumber(identifier);

    if (normalizedPhone) {
      // Find user by normalized phone number
      user = await prisma.user.findUnique({
        where: { phone: normalizedPhone },
      });
    }

    // Fallback: If not found by phone or identifier is an email, check by email (backward compatibility)
    if (!user && identifier.includes("@")) {
      user = await prisma.user.findUnique({
        where: { email: identifier.toLowerCase().trim() },
      });
    }

    // Also check if phone stored with spaces/raw exists
    if (!user && !normalizedPhone) {
      user = await prisma.user.findFirst({
        where: {
          OR: [
            { phone: identifier },
            { email: identifier.toLowerCase().trim() },
          ],
        },
      });
    }

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials. Please check your mobile number and password." },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: "Account is currently deactivated. Please contact barangay administration." },
        { status: 403 }
      );
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid credentials. Please check your mobile number and password." },
        { status: 401 }
      );
    }

    const token = signToken({
      id: user.id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      role: user.role as any,
      avatar: user.avatar,
    });

    await createAuditLog({
      actorId: user.id,
      action: "USER_LOGIN",
      entity: "User",
      entityId: user.id,
      newState: { phone: user.phone, email: user.email, role: user.role },
      ipAddress: req.headers.get("x-forwarded-for") || "local",
    });

    const response = NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
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
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during login." },
      { status: 500 }
    );
  }
}
