import prisma from "./db";

/**
 * Generates a unique, human-readable reference number for reports.
 * Example: BB-2026-000123
 */
export async function generateReferenceNumber(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const prefix = `BB-${currentYear}-`;

  // Count existing reports for this year to maintain readable index
  const count = await prisma.report.count();
  const nextNum = count + 1;
  const paddedNum = String(nextNum).padStart(6, "0");
  const candidate = `${prefix}${paddedNum}`;

  // Ensure uniqueness in case of concurrent creations
  const existing = await prisma.report.findUnique({
    where: { referenceNo: candidate },
  });

  if (!existing) {
    return candidate;
  }

  // If collision, append random 2-digit salt
  const randomSalt = Math.floor(10 + Math.random() * 90);
  return `${prefix}${String(nextNum).padStart(4, "0")}${randomSalt}`;
}
