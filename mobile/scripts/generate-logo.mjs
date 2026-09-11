// Sinh logo mới cho NEWS: nền vàng nâu (amber) + tia chớp trắng — mark gọn,
// không chiếm diện tích như ảnh logo cũ. Viết ra assets/logo-mark.png (icon)
// và assets/logo-maskable.png (maskable full-bleed).
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { encodePng } from './png.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const BOLL = [
  [312, 60],
  [150, 304],
  [246, 304],
  [196, 452],
  [370, 212],
  [266, 212],
  [348, 60],
];

function pointInPoly(px, py, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

// nền: gradient amber đứng (top -> bottom), bolt: trắng 100%
function render(bgRadius, boltScale) {
  const size = 512;
  const rgba = Buffer.alloc(size * size * 4);
  const top = [242, 181, 108];
  const bottom = [221, 146, 70];
  const center = 256;
  const scaled = BOLL.map(([x, y]) => [
    center + (x - center) * boltScale,
    center + (y - center) * boltScale,
  ]);
  for (let y = 0; y < size; y++) {
    const t = y / (size - 1);
    const r = Math.round(top[0] + (bottom[0] - top[0]) * t);
    const g = Math.round(top[1] + (bottom[1] - top[1]) * t);
    const b = Math.round(top[2] + (bottom[2] - top[2]) * t);
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      if (bgRadius > 0) {
        const qx = Math.max(bgRadius - x, x - (size - 1 - bgRadius), 0);
        const qy = Math.max(bgRadius - y, y - (size - 1 - bgRadius), 0);
        if (qx * qx + qy * qy > bgRadius * bgRadius) {
          rgba[i + 3] = 0;
          continue;
        }
      }
      if (pointInPoly(x, y, scaled)) {
        rgba[i] = 255;
        rgba[i + 1] = 255;
        rgba[i + 2] = 255;
      } else {
        rgba[i] = r;
        rgba[i + 1] = g;
        rgba[i + 2] = b;
      }
      rgba[i + 3] = 255;
    }
  }
  return encodePng(size, rgba);
}

writeFileSync(join(ROOT, 'assets', 'logo-mark.png'), render(112, 1.0));
writeFileSync(join(ROOT, 'assets', 'logo-maskable.png'), render(0, 0.55));
console.log('[generate-logo] logo-mark.png (rounded amber + bolt)');
console.log('[generate-logo] logo-maskable.png (full-bleed amber + bolt 55%)');