import path from "path";
import fs from "fs";
import sharp from "sharp";

async function generateIcons() {
  const sourceImagePath = "C:\\Users\\mcg45\\.gemini\\antigravity-ide\\brain\\bec5ecaf-f271-494c-bd79-623270a396d4\\.user_uploaded\\media_1789284804770.jpg";
  const publicDir = path.join(process.cwd(), "public");

  if (!fs.existsSync(sourceImagePath)) {
    throw new Error(`Source image not found at: ${sourceImagePath}`);
  }

  console.log("🎨 Loading uploaded official logo from:", sourceImagePath);
  const image = sharp(sourceImagePath);
  const metadata = await image.metadata();
  console.log(`   Dimensions: ${metadata.width}x${metadata.height}, format: ${metadata.format}`);

  // Targets to generate
  const targets = [
    { filename: "logo.png", size: 512 },
    { filename: "icon-512x512.png", size: 512 },
    { filename: "icon-192x192.png", size: 192 },
    { filename: "apple-touch-icon.png", size: 180 },
    { filename: "favicon-32x32.png", size: 32 },
    { filename: "favicon-16x16.png", size: 16 },
  ];

  for (const target of targets) {
    const outputPath = path.join(publicDir, target.filename);
    await sharp(sourceImagePath)
      .resize(target.size, target.size, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png({ quality: 100, compressionLevel: 9 })
      .toFile(outputPath);

    const stats = fs.statSync(outputPath);
    console.log(`   ✅ Generated ${target.filename} (${target.size}x${target.size}) - ${(stats.size / 1024).toFixed(1)} KB`);
  }

  // Generate favicon.ico (copy the 32x32 png as favicon.ico or write it)
  const icoPath = path.join(publicDir, "favicon.ico");
  fs.copyFileSync(path.join(publicDir, "favicon-32x32.png"), icoPath);
  console.log("   ✅ Created favicon.ico");

  console.log("\n✨ All official BantayBarangay branding assets generated successfully!");
}

generateIcons().catch((err) => {
  console.error("❌ Icon generation failed:", err);
  process.exit(1);
});
