/**
 * Convert iPhone HEIC dumps to WebP for the Torrens listing.
 * Uses heic-convert (handles more codecs than sharp alone on Windows).
 */
const fs = require('fs')
const fsp = require('fs/promises')
const path = require('path')
const sharp = require('sharp')
const convert = require('heic-convert')

const root = path.join(__dirname, '..')
const base = path.join(
  root,
  'public',
  'images',
  'torrens-trail',
  '472 torrens trl spirit lake-20260406T152346Z-1-001',
  '472 torrens trl spirit lake',
)
const outDir = path.join(root, 'public', 'images', 'torrens-trail', '472-web')

const groups = [
  { folder: 'exterior', label: 'Exterior' },
  { folder: 'interior', label: 'Interior' },
  { folder: 'torrens mother-inlaw', label: 'Mother-in-law unit' },
]

async function heicToWebp(inputPath, outPath) {
  const buffer = await fsp.readFile(inputPath)
  const jpegBuffer = await convert({ buffer, format: 'JPEG', quality: 0.92 })
  await sharp(jpegBuffer)
    .rotate()
    .resize({ width: 2200, height: 2200, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(outPath)
}

async function main() {
  if (!fs.existsSync(base)) {
    console.error('Missing import folder:', base)
    process.exit(1)
  }
  fs.mkdirSync(outDir, { recursive: true })

  let idx = 1
  const manifest = []
  const failed = []

  for (const g of groups) {
    const dir = path.join(base, g.folder)
    if (!fs.existsSync(dir)) {
      console.warn('Skip missing folder:', dir)
      continue
    }
    const files = fs.readdirSync(dir).filter((f) => /\.heic$/i.test(f)).sort()
    for (const f of files) {
      const input = path.join(dir, f)
      const outName = `${String(idx).padStart(3, '0')}.webp`
      const outPath = path.join(outDir, outName)
      try {
        await heicToWebp(input, outPath)
        manifest.push({
          src: `/images/torrens-trail/472-web/${outName}`,
          alt: `${g.label} — ${f.replace(/\.heic$/i, '')}`,
        })
        idx++
        if ((idx - 1) % 20 === 0) console.log('…', idx - 1, 'done')
      } catch (e) {
        failed.push({ file: input, err: String(e.message || e) })
        console.warn('SKIP', f, e.message || e)
      }
    }
  }

  const dataDir = path.join(root, 'src', 'data')
  fs.mkdirSync(dataDir, { recursive: true })
  fs.writeFileSync(path.join(dataDir, 'torrens-trail-472-photos.json'), JSON.stringify(manifest, null, 2))
  console.log('OK:', manifest.length, 'images →', path.relative(root, outDir))
  if (failed.length) console.log('Failed:', failed.length, '(see SKIP lines above)')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
