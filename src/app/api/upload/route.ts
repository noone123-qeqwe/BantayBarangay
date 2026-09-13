import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import prisma from "@/lib/db";
import { generateImageFingerprint, validateMagicBytes, checkForAISignatures } from "@/lib/analyzers/imageAnalyzer";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const type = (formData.get("type") as string) || "BEFORE"; // BEFORE, IN_PROGRESS, RESOLUTION

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG, and WebP images are permitted." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds the 5MB limit. Please compress the image." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // ─── Anti-Abuse: Validate magic bytes ───────────────────────────────────
    if (!validateMagicBytes(buffer, file.type)) {
      return NextResponse.json(
        { error: "File content does not match the declared image type. Please upload a valid image." },
        { status: 400 }
      );
    }

    // ─── Anti-Abuse: Generate perceptual fingerprint ────────────────────────
    const fingerprint = generateImageFingerprint(buffer);

    // ─── Anti-Abuse: Check for AI generator signatures in metadata ──────────
    const aiSignatures = checkForAISignatures(buffer);
    const hasAISignatures = aiSignatures.length > 0;

    // Determine extension safely
    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const uniqueFileName = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}.${ext}`;

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, uniqueFileName);
    await fs.writeFile(filePath, buffer);

    const publicUrl = `/uploads/${uniqueFileName}`;

    // ─── Anti-Abuse: Store fingerprint record ───────────────────────────────
    try {
      await prisma.photoFingerprint.create({
        data: {
          photoUrl: publicUrl,
          fingerprint,
          uploaderId: session.id,
          fileSize: file.size,
          mimeType: file.type,
        },
      });
    } catch (err) {
      console.error("Fingerprint storage error (non-blocking):", err);
    }

    // ─── Anti-Abuse: Check for duplicate uploads ────────────────────────────
    let duplicateWarning = null;
    try {
      const existingDuplicates = await prisma.photoFingerprint.findMany({
        where: {
          fingerprint,
          photoUrl: { not: publicUrl },
        },
        take: 3,
        orderBy: { createdAt: "desc" },
      });

      if (existingDuplicates.length > 0) {
        duplicateWarning = `This image appears to match ${existingDuplicates.length} previously uploaded photo(s).`;
      }
    } catch (err) {
      console.error("Duplicate check error (non-blocking):", err);
    }

    return NextResponse.json({
      url: publicUrl,
      fileName: uniqueFileName,
      size: file.size,
      type,
      fingerprint,
      duplicateWarning,
      hasAISignatures,
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload photo. Please try again." },
      { status: 500 }
    );
  }
}
