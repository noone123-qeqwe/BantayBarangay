// Application Semantic Version and Build Information
export const APP_LATEST_VERSION = "2.7.1";
export const CURRENT_CLIENT_VERSION = "2.7.0";
export const APP_BUILD_IDENTIFIER = "20260916-v2.7.1-auto-update-sync";
export const APP_RELEASE_NOTES =
  "Immersive fullscreen PWA experience, automatic update detection sync, and post-update confirmation.";

/**
 * Compares two semantic version strings.
 * Returns true ONLY if `latest` is strictly newer than `current`.
 * Handles formats like "2.4.6", "v2.5.0", "2.5.0-redesign".
 */
export function isNewerVersion(latest?: string | null, current?: string | null): boolean {
  if (!latest || !current) return false;

  const parse = (v: string): number[] =>
    v
      .replace(/^v/i, "")
      .split(/[-+]/)[0] // Strip pre-release tag e.g. -redesign
      .split(".")
      .map((part) => parseInt(part, 10) || 0);

  const lParts = parse(latest);
  const cParts = parse(current);
  const len = Math.max(lParts.length, cParts.length);

  for (let i = 0; i < len; i++) {
    const l = lParts[i] ?? 0;
    const c = cParts[i] ?? 0;
    if (l > c) return true;
    if (l < c) return false;
  }

  return false;
}
