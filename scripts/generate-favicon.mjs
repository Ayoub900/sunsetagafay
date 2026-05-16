import sharp from 'sharp';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// --ink background for favicon so it reads in any browser chrome
const INK = { r: 31, g: 26, b: 20, alpha: 1 };
const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };

// The circular SA emblem occupies the top ~68% of every 1500×1500 source logo.
function emblemCrop(src) {
  return sharp(src).extract({ left: 0, top: 0, width: 1500, height: 1020 });
}

async function createFavicon() {
  const whitePath = join(root, 'public', 'logo_white.png');

  // Favicon: white emblem on --ink background so it's legible at 16×16
  const sizes = [16, 32, 48];
  const pngBuffers = [];

  for (const size of sizes) {
    const emblem = await emblemCrop(whitePath)
      .resize(size, size, { fit: 'contain', background: TRANSPARENT })
      .png()
      .toBuffer();
    const buf = await sharp({ create: { width: size, height: size, channels: 4, background: INK } })
      .composite([{ input: emblem, blend: 'over' }])
      .withMetadata()
      .png()
      .toBuffer();
    pngBuffers.push({ size, buf });
  }

  const ico = buildIco(pngBuffers);
  writeFileSync(join(root, 'app', 'favicon.ico'), ico);
  console.log('✓ app/favicon.ico written');

  // icon.png: same treatment at 512×512
  const emblem512 = await emblemCrop(whitePath)
    .resize(512, 512, { fit: 'contain', background: TRANSPARENT })
    .png()
    .toBuffer();
  const iconBuf = await sharp({ create: { width: 512, height: 512, channels: 4, background: INK } })
    .composite([{ input: emblem512, blend: 'over' }])
    .withMetadata()
    .png()
    .toBuffer();
  writeFileSync(join(root, 'app', 'icon.png'), iconBuf);
  console.log('✓ app/icon.png written (512×512)');
}

async function createLogoEmblems() {
  // White emblem — Nav (top/dark) and Footer
  const whiteBuf = await emblemCrop(join(root, 'public', 'logo_white.png'))
    .resize(256, 256, { fit: 'contain', background: TRANSPARENT })
    .withMetadata()
    .png({ compressionLevel: 9 })
    .toBuffer();
  writeFileSync(join(root, 'public', 'logo_emblem_white.png'), whiteBuf);
  console.log('✓ public/logo_emblem_white.png written (256×256)');

  // Gold emblem — light/neutral background usage
  const goldBuf = await emblemCrop(join(root, 'public', 'logo_gold.png'))
    .resize(256, 256, { fit: 'contain', background: TRANSPARENT })
    .withMetadata()
    .png({ compressionLevel: 9 })
    .toBuffer();
  writeFileSync(join(root, 'public', 'logo_emblem_gold.png'), goldBuf);
  console.log('✓ public/logo_emblem_gold.png written (256×256)');

  // Black emblem — Nav scrolled state (cream background)
  const blackBuf = await emblemCrop(join(root, 'public', 'logo_black.png'))
    .resize(256, 256, { fit: 'contain', background: TRANSPARENT })
    .withMetadata()
    .png({ compressionLevel: 9 })
    .toBuffer();
  writeFileSync(join(root, 'public', 'logo_emblem_black.png'), blackBuf);
  console.log('✓ public/logo_emblem_black.png written (256×256)');
}

function buildIco(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);

  const dirEntrySize = 16;
  let offset = 6 + images.length * dirEntrySize;
  const dirs = [];

  for (const { size, buf } of images) {
    const entry = Buffer.alloc(dirEntrySize);
    entry.writeUInt8(size >= 256 ? 0 : size, 0);
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(buf.length, 8);
    entry.writeUInt32LE(offset, 12);
    dirs.push(entry);
    offset += buf.length;
  }

  return Buffer.concat([header, ...dirs, ...images.map(i => i.buf)]);
}

Promise.all([createFavicon(), createLogoEmblems()])
  .catch(err => { console.error(err); process.exit(1); });
