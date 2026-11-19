import { cp, mkdir, rm, copyFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, '..', '..');
const destination = path.resolve(here, '..', 'renderer');

await rm(destination, { recursive: true, force: true });
await mkdir(path.join(destination, 'assets'), { recursive: true });

await copyFile(path.join(projectRoot, 'index.html'), path.join(destination, 'index.html'));
await cp(path.join(projectRoot, 'assets'), path.join(destination, 'assets'), { recursive: true });
await copyFile(path.join(here, '..', 'build', 'icon.png'), path.join(destination, 'icon.png'));

console.log('Renderer prepared at', destination);
