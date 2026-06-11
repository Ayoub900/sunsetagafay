import sharp from 'sharp'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { unlink, stat } from 'fs/promises'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dirname, '..', 'public')

// source file  →  clean, descriptive webp name
const map = {
  'file_0000000000dc71f4a35c8b8785906336.png': 'suite-twin-desert.webp',
  'file_000000000c8872469e52b6faa965b8e9.png': 'pool-atlas-pano.webp',
  'file_000000000e5c720aa83856d67ca1b1fb.png': 'suite-tent-interior.webp',
  'file_00000000126471f4b3fb6600c3c164ea.png': 'aerial-sunset-pool.webp',
  'file_000000002648720cb86c0eaab126699b.png': 'pool-night.webp',
  'file_0000000028607243a0ab95dffa4a36fe.png': 'quad-desert.webp',
  'file_00000000315071f48dc011302ff22cb5.png': 'dining-tent-night.webp',
  'file_00000000374071f4b9c96769ac41b2c8.png': 'pool-infinity-desert.webp',
  'file_000000003f9c7246a26803049a7f715a.png': 'event-pool-tables.webp',
  'file_00000000538871f4b9f4c2c83560d2ed.png': 'aerial-suites-pool.webp',
  'file_000000005c3471f48f1a7adeed8891dd.png': 'event-dining-pool.webp',
  'file_000000007ef071f5859e0a67a99d64ea.png': 'suite-family.webp',
  'file_0000000083b872468fda20811a103ad9.png': 'couple-cocktails.webp',
  'file_000000009a98722f9483fd656ca852ac.png': 'suite-family-2.webp',
  'file_00000000a4dc71f4875a854c9c6ff062.png': 'aerial-dusk-resort.webp',
  'file_00000000a88472469a7736bc08ab82aa.png': 'pool-guests-day.webp',
  'file_00000000cf3c71f481474c8800da30fa.png': 'pool-palms-blue.webp',
  'file_00000000cf5872469b9d4a0cdfb4a187.png': 'pool-parasols-atlas.webp',
  'file_00000000f4f0720abaabac7d6fea9f0d.png': 'proposal-sunset.webp',
  'Screenshot_20260419_013310_Gallery.jpg': 'event-white-party-day.webp',
  'Screenshot_20260427_225247_WhatsAppBusiness.jpg': 'proposal-heart-sunset.webp',
  'Screenshot_20260511_175632_Gallery.jpg': 'event-white-party-night.webp',
  'Screenshot_20260511_175732_Gallery.jpg': 'event-white-party-sunset.webp',
}

// Cap the longest edge so files stay light but remain crisp on retina.
const MAX_EDGE = 1800

let totalIn = 0
let totalOut = 0

for (const [src, dest] of Object.entries(map)) {
  const srcPath = join(publicDir, src)
  const destPath = join(publicDir, dest)
  const before = (await stat(srcPath)).size
  await sharp(srcPath)
    .rotate() // respect EXIF orientation
    .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(destPath)
  const after = (await stat(destPath)).size
  totalIn += before
  totalOut += after
  const kb = (n) => (n / 1024).toFixed(0)
  console.log(`✓ ${dest.padEnd(28)} ${kb(before)}KB → ${kb(after)}KB`)
  await unlink(srcPath) // remove the original source file
}

console.log(
  `\nDone. ${Object.keys(map).length} images: ` +
  `${(totalIn / 1048576).toFixed(1)}MB → ${(totalOut / 1048576).toFixed(1)}MB`
)
