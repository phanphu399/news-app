import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { decodePng, encodePng, makeSquareIcon, fitMaskable, cropToContent } from './png.mjs';
import { SOURCE_PNG } from './build-web.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ASSETS = join(ROOT, 'assets');

mkdirSync(ASSETS, { recursive: true });

const src = decodePng(readFileSync(SOURCE_PNG));
const cropped = cropToContent(src.data, src.width, src.height);

// App icon — logo thật, cắt lề trong suốt để banner to, rõ
writeFileSync(join(ASSETS, 'icon.png'), encodePng(1024, makeSquareIcon(src.data, src.width, src.height, 1024, 0.98)));

// Splash — logo giữa nền dark, có lề an toàn cho máy ngang/dọc
writeFileSync(join(ASSETS, 'splash.png'), encodePng(1024, fitMaskable(cropped.data, cropped.width, cropped.height, 1024, 0.7)));

// Notification icon — logo co lại trong vùng an toàn
writeFileSync(join(ASSETS, 'notification-icon.png'), encodePng(512, fitMaskable(cropped.data, cropped.width, cropped.height, 512, 0.9)));

console.log('[generate-assets] app assets written: icon.png, splash.png, notification-icon.png');