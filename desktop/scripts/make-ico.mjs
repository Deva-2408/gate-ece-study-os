import sharp from 'sharp';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeFile } from 'node:fs/promises';

const here = path.dirname(fileURLToPath(import.meta.url));
const buildDir = path.resolve(here, '..', 'build');
const source = path.join(buildDir, 'icon.svg');
const sizes = [16, 24, 32, 48, 64, 128, 256];

function dibFor(size, rgba) {
  const header = Buffer.alloc(40);
  header.writeUInt32LE(40, 0);
  header.writeInt32LE(size, 4);
  header.writeInt32LE(size * 2, 8); // XOR + AND mask
  header.writeUInt16LE(1, 12);
  header.writeUInt16LE(32, 14);
  header.writeUInt32LE(0, 16);
  header.writeUInt32LE(size * size * 4, 20);
  header.writeInt32LE(0, 24);
  header.writeInt32LE(0, 28);
  header.writeUInt32LE(0, 32);
  header.writeUInt32LE(0, 36);

  const xor = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y += 1) {
    const srcRow = (size - 1 - y) * size * 4;
    for (let x = 0; x < size; x += 1) {
      const s = srcRow + x * 4;
      const d = (y * size + x) * 4;
      xor[d] = rgba[s + 2]; // B
      xor[d + 1] = rgba[s + 1]; // G
      xor[d + 2] = rgba[s]; // R
      xor[d + 3] = rgba[s + 3]; // A
    }
  }

  const maskRowBytes = Math.ceil(size / 32) * 4;
  const mask = Buffer.alloc(maskRowBytes * size, 0);
  for (let y = 0; y < size; y += 1) {
    const srcRow = (size - 1 - y) * size * 4;
    for (let x = 0; x < size; x += 1) {
      if (rgba[srcRow + x * 4 + 3] < 128) {
        mask[y * maskRowBytes + (x >> 3)] |= 0x80 >> (x & 7);
      }
    }
  }

  return Buffer.concat([header, xor, mask]);
}

const images = [];
for (const size of sizes) {
  const { data } = await sharp(source, { density: 384 })
    .resize(size, size)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  images.push({ size, data });
}

const dir = Buffer.alloc(6 + images.length * 16);
dir.writeUInt16LE(0, 0);
dir.writeUInt16LE(1, 2);
dir.writeUInt16LE(images.length, 4);

let offset = dir.length;
const blobs = [];
images.forEach((image, index) => {
  const blob = dibFor(image.size, image.data);
  const entry = 6 + index * 16;
  dir.writeUInt8(image.size === 256 ? 0 : image.size, entry);
  dir.writeUInt8(image.size === 256 ? 0 : image.size, entry + 1);
  dir.writeUInt8(0, entry + 2);
  dir.writeUInt8(0, entry + 3);
  dir.writeUInt16LE(1, entry + 4);
  dir.writeUInt16LE(32, entry + 6);
  dir.writeUInt32LE(blob.length, entry + 8);
  dir.writeUInt32LE(offset, entry + 12);
  offset += blob.length;
  blobs.push(blob);
});

await writeFile(path.join(buildDir, 'icon.ico'), Buffer.concat([dir, ...blobs]));
console.log('Wrote build/icon.ico', Math.round(offset / 1024), 'KB');
