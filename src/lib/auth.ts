import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import prisma from "./db";

function getJwtSecret(): string {
  return process.env.JWT_SECRET || "bantay-barangay-super-secure-production-key-2026";
}

export const COOKIE_NAME = "bantay_session";

export interface SessionUser {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  role: "RESIDENT" | "STAFF" | "ADMIN" | "SUPER_ADMIN";
  avatar?: string | null;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(user: SessionUser): string {
  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email || null,
      phone: user.phone || null,
      role: user.role,
      avatar: user.avatar || null,
    },
    getJwtSecret(),
    { expiresIn: "7d" }
  );
}

export function verifyToken(token: string): SessionUser | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as SessionUser;
    return decoded;
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return verifyToken(token);
  } catch {
    return null;
  }
}

export async function getFullCurrentUser() {
  const session = await getCurrentUser();
  if (!session) return null;
  return prisma.user.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      birthDate: true,
      age: true,
      avatar: true,
      preferredLanguage: true,
      isActive: true,
      createdAt: true,
    },
  });
}

// Role hierarchy levels
const ROLE_LEVELS: Record<string, number> = {
  RESIDENT: 1,
  STAFF: 2,
  ADMIN: 3,
  SUPER_ADMIN: 4,
};

export function hasMinimumRole(userRole: string, requiredRole: string): boolean {
  const current = ROLE_LEVELS[userRole] || 0;
  const target = ROLE_LEVELS[requiredRole] || 0;
  return current >= target;
}

export function isStaffOrAdmin(role: string): boolean {
  return ["STAFF", "ADMIN", "SUPER_ADMIN"].includes(role);
}

export function isAdmin(role: string): boolean {
  return ["ADMIN", "SUPER_ADMIN"].includes(role);
}

export function authError(message = "Unauthorized", status = 401) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Returns the designated dashboard route for a given user role.
 */
export function getRoleDashboard(role?: string | null): string {
  if (!role) return "/dashboard";
  const normalized = role.toUpperCase();
  if (normalized === "ADMIN" || normalized === "SUPER_ADMIN") {
    return "/admin";
  }
  return "/dashboard";
}
