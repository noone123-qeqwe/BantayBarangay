import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "bantay_session";

/**
 * Safely decodes a JWT payload in the Next.js edge/server runtime without external dependencies.
 */
function decodeJwtPayload(token: string): {
  id?: string;
  name?: string;
  role?: string;
  exp?: number;
} | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const parsed = JSON.parse(jsonPayload);
    // Check if token has expired
    if (parsed.exp && parsed.exp * 1000 < Date.now()) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(COOKIE_NAME)?.value;
  const session = token ? decodeJwtPayload(token) : null;
  const isAuthenticated = !!session;

  const isAuthPage =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password";

  // 1. Authenticated users redirect from /register and /forgot-password
  if (pathname === "/register" || pathname === "/forgot-password") {
    if (isAuthenticated) {
      const role = session.role?.toUpperCase();
      const targetDashboard = (role === "ADMIN" || role === "SUPER_ADMIN") ? "/admin" : "/dashboard";
      return NextResponse.redirect(new URL(targetDashboard, req.url));
    }
    return NextResponse.next();
  }

  // 2. Admin routes protection (/admin and subpaths)
  if (pathname.startsWith("/admin")) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
    const role = session.role?.toUpperCase();
    if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
      // Unauthorized role -> redirect to standard resident/staff dashboard
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  // 3. Protected resident/staff application routes
  const isProtectedRoute =
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/") ||
    pathname === "/reports/new" ||
    pathname === "/profile" ||
    pathname.startsWith("/profile/") ||
    pathname === "/notifications" ||
    pathname.startsWith("/notifications/");

  if (isProtectedRoute) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/register",
    "/forgot-password",
    "/dashboard",
    "/dashboard/:path*",
    "/admin",
    "/admin/:path*",
    "/reports/new",
    "/profile",
    "/profile/:path*",
    "/notifications",
    "/notifications/:path*",
  ],
};
