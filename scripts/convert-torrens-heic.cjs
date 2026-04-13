/**
 * Convert iPhone HEIC dumps to WebP for the Torrens listing.
 * Uses heic-convert because it handles more HEIC variants on Windows.
 */
const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const sharp = require("sharp");
const convert = require("heic-convert");

const root = path.join(__dirname, "..");
const base = path.join(
  root,
  "source-assets",
  "torrens-trail",
  "472 torrens trl spirit lake-20260406T152346Z-1-001",
  "472 torrens trl spirit lake"
);
const outDir = path.join(root, "public", "images", "torrens-trail", "472-web");

const groups = [
  { folder: "exterior", label: "Exterior" },
  { folder: "interior", label: "Interior" },
  { folder: "torrens mother-inlaw", label: "Mother-in-law unit" },
];

async function heicToWebp(inputPath, outPath) {
  const buffer = await fsp.readFile(inputPath);
  const jpegBuffer = await convert({ buffer, format: "JPEG", quality: 0.92 });
  await sharp(jpegBuffer)
    .rotate()
    .resize({ width: 1800, height: 1800, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 76, effort: 6 })
    .toFile(outPath);
}

async function main() {
  if (!fs.existsSync(base)) {
    console.error("Missing import folder:", base);
    process.exit(1);
  }
  fs.mkdirSync(outDir, { recursive: true });

  let idx = 1;
  const manifest = [];
  const failed = [];

  for (const group of groups) {
    const dir = path.join(base, group.folder);
    if (!fs.existsSync(dir)) {
      console.warn("Skip missing folder:", dir);
      continue;
    }

    const files = fs.readdirSync(dir).filter((file) => /\.heic$/i.test(file)).sort();
    for (const file of files) {
      const input = path.join(dir, file);
      const outName = `${String(idx).padStart(3, "0")}.webp`;
      const outPath = path.join(outDir, outName);
      try {
        await heicToWebp(input, outPath);
        manifest.push({
          src: `/images/torrens-trail/472-web/${outName}`,
          alt: `${group.label} - ${file.replace(/\.heic$/i, "")}`,
        });
        idx += 1;
        if ((idx - 1) % 20 === 0) {
          console.log("...", idx - 1, "done");
        }
      } catch (error) {
        failed.push({ file: input, err: String(error.message || error) });
        console.warn("SKIP", file, error.message || error);
      }
    }
  }

  const dataDir = path.join(root, "src", "data");
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(path.join(dataDir, "torrens-trail-472-photos.json"), JSON.stringify(manifest, null, 2));
  console.log("OK:", manifest.length, "images ->", path.relative(root, outDir));
  if (failed.length) {
    console.log("Failed:", failed.length, "(see SKIP lines above)");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
