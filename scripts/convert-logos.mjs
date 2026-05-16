import sharp from 'sharp'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dirname, '..', 'public')

const logos = ['logo_black', 'logo_gold', 'logo_white']

for (const name of logos) {
  const src = join(publicDir, `${name}.png`)
  const dest = join(publicDir, `${name}.webp`)
  await sharp(src).webp({ quality: 85 }).toFile(dest)
  console.log(`✓ ${name}.webp`)
}
