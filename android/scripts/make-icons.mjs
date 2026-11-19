import sharp from 'sharp';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir } from 'node:fs/promises';

const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, '..', '..');
const resRoot = path.resolve(here, '..', 'app', 'src', 'main', 'res');
const fullIcon = path.join(projectRoot, 'desktop', 'build', 'icon.svg');
const foreground = path.join(projectRoot, 'android', 'icon', 'foreground.svg');

const densities = [
  ['mdpi', 1, 48],
  ['hdpi', 1.5, 72],
  ['xhdpi', 2, 96],
  ['xxhdpi', 3, 144],
  ['xxxhdpi', 4, 192]
];

for (const [name, scale, size] of densities) {
  const dir = path.join(resRoot, `mipmap-${name}`);
  await mkdir(dir, { recursive: true });
  await sharp(fullIcon).resize(size, size).png().toFile(path.join(dir, 'ic_launcher.png'));
  await sharp(fullIcon).resize(size, size).png().toFile(path.join(dir, 'ic_launcher_round.png'));
  const fg = Math.round(scale * 108);
  await sharp(foreground).resize(fg, fg).png().toFile(path.join(dir, 'ic_launcher_foreground.png'));
}

console.log('Android launcher icons generated');
