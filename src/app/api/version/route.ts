import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// BantayBarangay semantic application version
const CURRENT_APP_VERSION = "2.4.0";
// Build marker
const BUILD_IDENTIFIER = "20260914-v2.4.0";

export async function GET() {
  return NextResponse.json(
    {
      version: CURRENT_APP_VERSION,
      build: BUILD_IDENTIFIER,
      timestamp: Date.now(),
      releaseNotes: "Performance upgrades, authentication stability fixes, and refreshed civic dark theme UI.",
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
