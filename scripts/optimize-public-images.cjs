const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const root = path.join(__dirname, "..");
const teamDir = path.join(root, "public", "images", "team");

function formatKB(bytes) {
  return `${Math.round(bytes / 1024).toLocaleString()} KB`;
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
  const team = await optimizeTeamPhotos();

  for (const photo of team) {
    console.log(`[team] ${photo.fileName}: ${formatKB(photo.before)} -> ${formatKB(photo.after)}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
