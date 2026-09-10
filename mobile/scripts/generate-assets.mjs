import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { drawIcon } from './build-web.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ASSETS = join(ROOT, 'assets');

mkdirSync(ASSETS, { recursive: true });

// App icon — full-bleed brand mark (no rounded corners, edges blend with #0b0e14)
writeFileSync(join(ASSETS, 'icon.png'), drawIcon(1024, true));

// Splash — centered brand mark on dark background
writeFileSync(join(ASSETS, 'splash.png'), drawIcon(1024, true));

// Notification icon — compact monochrome glyph, plenty of safe padding
writeFileSync(join(ASSETS, 'notification-icon.png'), drawIcon(512, true));

console.log('[generate-assets] app assets written: icon.png, splash.png, notification-icon.png');