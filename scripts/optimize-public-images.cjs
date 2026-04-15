const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const root = path.join(__dirname, "..");
const torrensDir = path.join(root, "public", "images", "torrens-trail", "472-web");
const teamDir = path.join(root, "public", "images", "team");

function formatKB(bytes) {
  return `${Math.round(bytes / 1024).toLocaleString()} KB`;
}

async function optimizeWebpGallery() {
  if (!fs.existsSync(torrensDir)) {
    return { count: 0, before: 0, after: 0 };
  }

  const files = fs
    .readdirSync(torrensDir)
    .filter((name) => name.toLowerCase().endsWith(".webp"))
    .sort();

  let before = 0;
  let after = 0;

  for (const name of files) {
    const filePath = path.join(torrensDir, name);
    const originalBuffer = fs.readFileSync(filePath);
    before += originalBuffer.length;

    const optimizedBuffer = await sharp(originalBuffer)
      .rotate()
      .webp({ quality: 72, effort: 6 })
      .toBuffer();

    fs.writeFileSync(filePath, optimizedBuffer);
    after += optimizedBuffer.length;
  }

  return { count: files.length, before, after };
}

async function optimizeTeamPhoto(fileName, options) {
  const filePath = path.join(teamDir, fileName);
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const originalBuffer = fs.readFileSync(filePath);
  const pipeline = sharp(originalBuffer).rotate();
  if (options.maxWidth) {
    pipeline.resize({ width: options.maxWidth, withoutEnlargement: true });
  }

  const optimizedBuffer = await pipeline.jpeg({
    quality: options.quality ?? 78,
    mozjpeg: true,
    progressive: true,
  }).toBuffer();

  fs.writeFileSync(filePath, optimizedBuffer);

  return {
    fileName,
    before: originalBuffer.length,
    after: optimizedBuffer.length,
  };
}

async function optimizeTeamPhotos() {
  if (!fs.existsSync(teamDir)) {
    return [];
  }

  const results = [];
  const logan = await optimizeTeamPhoto("logan.jpg", { maxWidth: 1200, quality: 76 });
  if (logan) results.push(logan);
  const adam = await optimizeTeamPhoto("adam.jpg", { maxWidth: 720, quality: 84 });
  if (adam) results.push(adam);
  return results;
}

async function main() {
  const gallery = await optimizeWebpGallery();
  const team = await optimizeTeamPhotos();

  console.log(
    `[gallery] ${gallery.count} files: ${formatKB(gallery.before)} -> ${formatKB(gallery.after)}`
  );

  for (const photo of team) {
    console.log(`[team] ${photo.fileName}: ${formatKB(photo.before)} -> ${formatKB(photo.after)}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
