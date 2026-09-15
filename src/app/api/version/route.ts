import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// BantayBarangay semantic application version
const CURRENT_APP_VERSION = "2.5.0";
// Build marker
const BUILD_IDENTIFIER = "20260915-v2.5.0-redesign";

export async function GET() {
  return NextResponse.json(
    {
      version: CURRENT_APP_VERSION,
      build: BUILD_IDENTIFIER,
      timestamp: Date.now(),
      releaseNotes: "Obsidian minimal redesign for login, registration, and dashboard. Enhanced PWA cache busting.",
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    }
  );
}
