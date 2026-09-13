/**
 * Philippine Phone Number Utilities
 *
 * Supports:
 * - 09XXXXXXXXX (Domestic standard)
 * - +639XXXXXXXXX (International E.164)
 * - 639XXXXXXXXX
 * - Formatted strings like "+63 917 123 4567" or "0917-123-4567"
 *
 * Normalizes all valid formats to canonical E.164: +639XXXXXXXXX
 */

/**
 * Normalizes a raw Philippine phone number to canonical E.164 format (+639XXXXXXXXX).
 * Returns null if the number is invalid.
 */
export function normalizePhoneNumber(raw: string | null | undefined): string | null {
  if (!raw || typeof raw !== "string") return null;

  // Remove common separators and whitespace
  let cleaned = raw.trim().replace(/[\s\-\(\)\.\,\+]/g, "");

  // Handle leading country code or zero
  if (cleaned.startsWith("63")) {
    cleaned = cleaned.substring(2);
  } else if (cleaned.startsWith("0")) {
    cleaned = cleaned.substring(1);
  }

  // A valid Philippine mobile number must now be exactly 10 digits starting with 9 (e.g. 9171234567)
  if (!/^9\d{9}$/.test(cleaned)) {
    return null;
  }

  return `+63${cleaned}`;
}

/**
 * Checks if a phone number string is a valid Philippine mobile number.
 */
export function isValidPhilippinePhone(raw: string | null | undefined): boolean {
  return normalizePhoneNumber(raw) !== null;
}

/**
 * Converts a normalized or raw phone number to domestic format (09XXXXXXXXX).
 */
export function formatLocalPhone(raw: string): string {
  const normalized = normalizePhoneNumber(raw);
  if (!normalized) return raw;
  return `0${normalized.substring(3)}`;
}

/**
 * Formats a phone number for attractive visual display (e.g. "0917 123 4567" or "+63 917 123 4567").
 */
export function formatDisplayPhone(raw: string, international = false): string {
  const normalized = normalizePhoneNumber(raw);
  if (!normalized) return raw;

  const subscriber = normalized.substring(3); // e.g. 9171234567
  const part1 = subscriber.substring(0, 3); // 917
  const part2 = subscriber.substring(3, 6); // 123
  const part3 = subscriber.substring(6);    // 4567

  if (international) {
    return `+63 ${part1} ${part2} ${part3}`;
  }
  return `0${part1} ${part2} ${part3}`;
}

/**
 * Masks a mobile number for security displays: e.g. "09********67".
 */
export function maskPhone(raw: string): string {
  const local = formatLocalPhone(raw);
  if (local.length < 4) return local;
  const prefix = local.substring(0, 2); // "09"
  const suffix = local.substring(local.length - 2); // e.g. "67"
  return `${prefix}********${suffix}`;
}
