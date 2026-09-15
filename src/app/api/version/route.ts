import { NextResponse } from "next/server";
import {
  APP_LATEST_VERSION,
  APP_BUILD_IDENTIFIER,
  APP_RELEASE_NOTES,
} from "@/lib/version";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    {
      version: APP_LATEST_VERSION,
      build: APP_BUILD_IDENTIFIER,
      timestamp: Date.now(),
      releaseNotes: APP_RELEASE_NOTES,
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
