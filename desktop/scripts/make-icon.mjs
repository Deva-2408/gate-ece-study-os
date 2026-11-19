import sharp from 'sharp';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const buildDir = path.resolve(here, '..', 'build');

await sharp(path.join(buildDir, 'icon.svg'))
  .resize(512, 512)
  .png()
  .toFile(path.join(buildDir, 'icon.png'));

await sharp(path.join(buildDir, 'icon.svg'))
  .resize(256, 256)
  .png()
  .toFile(path.join(buildDir, 'icon-256.png'));

console.log('Icons generated');
