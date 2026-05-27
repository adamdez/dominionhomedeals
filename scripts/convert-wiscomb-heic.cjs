const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const sharp = require("sharp");
const convert = require("heic-convert");

const root = path.join(__dirname, "..");
const inputDir =
  process.env.WISCOMB_PHOTOS_DIR ||
  "G:\\.shortcut-targets-by-id\\1clJQ9z5cHVA5fPuFSTP7E5mYoLaO1MKk\\Wiscomb photos";
const outDir = path.join(root, "public", "images", "2443-n-wiscomb-st");
const dataDir = path.join(root, "src", "data");
const manifestPath = path.join(dataDir, "2443-n-wiscomb-st-photos.json");

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
  if (!fs.existsSync(inputDir)) {
    console.error("Missing Wiscomb photos folder:", inputDir);
    process.exit(1);
  }

  fs.mkdirSync(outDir, { recursive: true });
  fs.mkdirSync(dataDir, { recursive: true });

  const files = fs
    .readdirSync(inputDir)
    .filter((file) => /\.heic$/i.test(file))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  const manifest = [];
  const failed = [];

  for (let i = 0; i < files.length; i += 1) {
    const file = files[i];
    const input = path.join(inputDir, file);
    const outName = `${String(i + 1).padStart(3, "0")}.webp`;
    const outPath = path.join(outDir, outName);

    try {
      await heicToWebp(input, outPath);
      manifest.push({
        src: `/images/2443-n-wiscomb-st/${outName}`,
        alt: `2443 N Wiscomb St - property photo ${i + 1}`,
      });
      if ((i + 1) % 10 === 0) {
        console.log("...", i + 1, "done");
      }
    } catch (error) {
      failed.push({ file: input, error: String(error.message || error) });
      console.warn("SKIP", file, error.message || error);
    }
  }

  await fsp.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log("OK:", manifest.length, "images ->", path.relative(root, outDir));
  if (failed.length) {
    console.log("Failed:", failed.length);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
