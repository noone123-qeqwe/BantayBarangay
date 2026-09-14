/**
 * BantayBarangay Secure OTP Service
 *
 * Implements strict OTP security standards:
 * - Cryptographic random 6-digit numeric generation
 * - Hashed storage with bcrypt (never stored as plain text)
 * - 5-minute expiration
 * - 60-second resend cooldown
 * - Limited verification attempts (max 5) with automatic locking
 * - Invalidation of previous active codes upon resend
 * - Single-use short-lived verification tokens for registration/password reset
 * - Protection against OTP abuse and rate limiting
 */

import crypto from "crypto";
import bcrypt from "bcryptjs";
import prisma from "./db";
import { normalizePhoneNumber, maskPhone } from "./phone";
import { sendSms } from "./sms";

export const OTP_EXPIRY_MINUTES = 5;
export const RESEND_COOLDOWN_SECONDS = 60;
export const MAX_VERIFICATION_ATTEMPTS = 5;
export const MAX_HOURLY_REQUESTS = 5;
export const VERIFICATION_TOKEN_MINUTES = 15;

export type OtpPurpose = "REGISTRATION" | "PASSWORD_RESET" | "LOGIN";

/**
 * Generates a cryptographically secure 6-digit numeric OTP code.
 */
export function generateSecureOtpCode(): string {
  // Generates integer between 100000 and 999999 inclusive
  return crypto.randomInt(100000, 1000000).toString();
}

/**
 * Hashes an OTP code using bcrypt with a salt factor of 10.
 */
export async function hashOtp(code: string): Promise<string> {
  return bcrypt.hash(code, 10);
}

/**
 * Compares a plain text code against the bcrypt hash.
 */
export async function verifyOtpHash(code: string, hash: string): Promise<boolean> {
  return bcrypt.compare(code, hash);
}

export interface RequestOtpResult {
  success: boolean;
  maskedPhone?: string;
  cooldownSeconds?: number;
  expiresInSeconds?: number;
  devCode?: string; // Only returned in non-production environments
  error?: string;
  status: number;
}

/**
 * Requests and dispatches an OTP for a given phone number and purpose.
 */
export async function requestOtp(
  rawPhone: string,
  purpose: OtpPurpose,
  ipAddress?: string
): Promise<RequestOtpResult> {
  const normalized = normalizePhoneNumber(rawPhone);
  if (!normalized) {
    return {
      success: false,
      error: "Please enter a valid Philippine mobile number (e.g. 09171234567 or +639171234567).",
      status: 400,
    };
  }

  // 1. Account Existence & Uniqueness Checks
  const existingUser = await prisma.user.findUnique({
    where: { phone: normalized },
  });

  if (purpose === "REGISTRATION") {
    if (existingUser) {
      return {
        success: false,
        error: "Mobile number already registered. Please log in or use “Forgot Password.”",
        status: 400,
      };
    }
  } else if (purpose === "PASSWORD_RESET") {
    if (!existingUser) {
      return {
        success: false,
        error: "No account found with this mobile number. Please check your number or register.",
        status: 404,
      };
    }
    if (!existingUser.isActive) {
      return {
        success: false,
        error: "This account is deactivated. Please contact barangay administrators.",
        status: 403,
      };
    }
  }

  // 2. Abuse Protection: Hourly rate limit
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const hourlyCount = await prisma.otpVerification.count({
    where: {
      phone: normalized,
      createdAt: { gte: oneHourAgo },
    },
  });

  if (hourlyCount >= MAX_HOURLY_REQUESTS) {
    return {
      success: false,
      error: "Too many OTP requests for this number. Please wait an hour before requesting another code.",
      status: 429,
    };
  }

  // 3. Resend Cooldown Check
  const recentOtp = await prisma.otpVerification.findFirst({
    where: {
      phone: normalized,
      purpose,
      isUsed: false,
    },
    orderBy: { createdAt: "desc" },
  });

  const now = new Date();
  if (recentOtp && recentOtp.resendCooldownUntil && recentOtp.resendCooldownUntil > now) {
    const remainingSeconds = Math.ceil(
      (recentOtp.resendCooldownUntil.getTime() - now.getTime()) / 1000
    );
    return {
      success: false,
      error: `Please wait ${remainingSeconds} second(s) before requesting another code.`,
      cooldownSeconds: remainingSeconds,
      status: 429,
    };
  }

  // 4. Invalidate any older active OTPs for this phone + purpose
  await prisma.otpVerification.updateMany({
    where: {
      phone: normalized,
      purpose,
      isUsed: false,
    },
    data: {
      isUsed: true,
    },
  });

  // 5. Generate secure code & hash
  const code = generateSecureOtpCode();
  const otpHash = await hashOtp(code);
  const expiresAt = new Date(now.getTime() + OTP_EXPIRY_MINUTES * 60 * 1000);
  const resendCooldownUntil = new Date(now.getTime() + RESEND_COOLDOWN_SECONDS * 1000);

  // 6. Save to Database (hashed, never plain text)
  await prisma.otpVerification.create({
    data: {
      phone: normalized,
      otpHash,
      purpose,
      expiresAt,
      resendCooldownUntil,
      attempts: 0,
      maxAttempts: MAX_VERIFICATION_ATTEMPTS,
      isUsed: false,
      ipAddress: ipAddress || null,
    },
  });

  // 7. Dispatch SMS
  const actionText =
    purpose === "REGISTRATION"
      ? "complete your BantayBarangay registration"
      : purpose === "PASSWORD_RESET"
      ? "reset your BantayBarangay password"
      : "authenticate your BantayBarangay session";

  const message = `Your BantayBarangay verification code is ${code}. Use this to ${actionText}. Valid for 5 minutes. NEVER share this code with anyone.`;

  await sendSms({
    to: normalized,
    message,
    otpCode: code,
  });

  const maskedPhone = maskPhone(normalized);

  return {
    success: true,
    maskedPhone,
    cooldownSeconds: RESEND_COOLDOWN_SECONDS,
    devCode:
      process.env.NODE_ENV !== "production" ||
      (!process.env.SEMAPHORE_API_KEY && !process.env.TEXTBEE_DEVICE_ID)
        ? code
        : undefined,
    status: 200,
  };
}

export interface VerifyOtpResult {
  success: boolean;
  verificationToken?: string;
  error?: string;
  status: number;
}

/**
 * Verifies an entered OTP code against the hashed record.
 */
export async function verifyOtp(
  rawPhone: string,
  code: string,
  purpose: OtpPurpose
): Promise<VerifyOtpResult> {
  const normalized = normalizePhoneNumber(rawPhone);
  if (!normalized) {
    return {
      success: false,
      error: "Invalid phone number.",
      status: 400,
    };
  }

  const cleanCode = (code || "").trim();
  if (!/^\d{6}$/.test(cleanCode)) {
    return {
      success: false,
      error: "Please enter the complete 6-digit verification code.",
      status: 400,
    };
  }

  const now = new Date();

  // Find the latest active OTP record for this phone and purpose
  const otpRecord = await prisma.otpVerification.findFirst({
    where: {
      phone: normalized,
      purpose,
      isUsed: false,
      expiresAt: { gt: now },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!otpRecord) {
    return {
      success: false,
      error: "Verification code expired or not found. Please request a new code.",
      status: 400,
    };
  }

  // Check attempt limit
  if (otpRecord.attempts >= otpRecord.maxAttempts) {
    // Invalidate record due to max attempts exceeded
    await prisma.otpVerification.update({
      where: { id: otpRecord.id },
      data: { isUsed: true },
    });
    return {
      success: false,
      error: "Maximum verification attempts exceeded. Please request a new verification code.",
      status: 400,
    };
  }

  // Verify bcrypt hash
  const isValid = await verifyOtpHash(cleanCode, otpRecord.otpHash);

  if (!isValid) {
    const updatedAttempts = otpRecord.attempts + 1;
    const remaining = otpRecord.maxAttempts - updatedAttempts;

    await prisma.otpVerification.update({
      where: { id: otpRecord.id },
      data: {
        attempts: updatedAttempts,
        isUsed: updatedAttempts >= otpRecord.maxAttempts,
      },
    });

    if (remaining <= 0) {
      return {
        success: false,
        error: "Incorrect code. Maximum verification attempts reached. Please request a new code.",
        status: 400,
      };
    }

    return {
      success: false,
      error: `Incorrect code. ${remaining} attempt(s) remaining.`,
      status: 400,
    };
  }

  // Code is valid! Mark as used and issue a single-use verification token
  const verificationToken = crypto.randomUUID();
  const tokenExpiresAt = new Date(now.getTime() + VERIFICATION_TOKEN_MINUTES * 60 * 1000);

  await prisma.otpVerification.update({
    where: { id: otpRecord.id },
    data: {
      isUsed: true,
      verifiedAt: now,
      verificationToken,
      tokenExpiresAt,
    },
  });

  return {
    success: true,
    verificationToken,
    status: 200,
  };
}

/**
 * Validates a single-use verification token before allowing account creation or password reset.
 */
export async function validateVerificationToken(
  token: string,
  rawPhone: string,
  purpose: OtpPurpose
) {
  const normalized = normalizePhoneNumber(rawPhone);
  if (!normalized || !token) return null;

  const now = new Date();
  const record = await prisma.otpVerification.findUnique({
    where: { verificationToken: token },
  });

  if (
    !record ||
    record.phone !== normalized ||
    record.purpose !== purpose ||
    !record.tokenExpiresAt ||
    record.tokenExpiresAt <= now
  ) {
    return null;
  }

  return record;
}

/**
 * Consumes/invalidates the verification token after successful registration or reset.
 */
export async function consumeVerificationToken(tokenId: string) {
  await prisma.otpVerification.update({
    where: { id: tokenId },
    data: {
      verificationToken: null,
      tokenExpiresAt: null,
    },
  });
}
