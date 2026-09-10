import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'assets', 'sounds', 'chime-soft.wav');

const SAMPLE_RATE = 22050;
const DURATION = 1.4;
const N = Math.floor(SAMPLE_RATE * DURATION);

// Hai nốt lồng nhau dạng mộc cầm (marimba) — mềm, dễ chịu, không chói tai.
const NOTES = [
  { freq: 659.25, at: 0.05, vol: 0.30 }, // E5
  { freq: 987.77, at: 0.22, vol: 0.22 }, // B5 (quãng năm lên — dễ nghe)
  { freq: 1318.5, at: 0.40, vol: 0.10 }, // E6 (lấp lánh nhẹ)
];
const HARMONICS = [1.0, 0.35, 0.12];

function bell(freq, tInSeconds, vol, out) {
  const tau = 0.30;
  const attack = 0.008;
  for (const [k, hw] of HARMONICS.entries()) {
    const f = freq * (k + 1);
    const start = Math.floor(tInSeconds * SAMPLE_RATE);
    for (let i = start; i < N; i++) {
      const t = (i - start) / SAMPLE_RATE;
      if (t > 1.15) break;
      const env = Math.min(1, t / attack) * Math.exp(-t / tau);
      out[i] += hw * vol * env * Math.sin(2 * Math.PI * f * t);
    }
  }
}

const samples = new Float64Array(N);
for (const note of NOTES) bell(note.freq, note.at, note.vol, samples);

const peak = Math.max(...samples.map((v) => Math.abs(v)));
const gain = peak > 0.9 ? 0.9 / peak : 1;

const pcm = Buffer.alloc(N * 2);
for (let i = 0; i < N; i++) {
  let v = samples[i] * gain;
  if (v > 0.98) v = 0.98;
  if (v < -0.98) v = -0.98;
  pcm.writeInt16LE(Math.round(v * 32767), i * 2);
}

const header = Buffer.alloc(44);
header.write('RIFF', 0);
header.writeUInt32LE(36 + pcm.length, 4);
header.write('WAVE', 8);
header.write('fmt ', 12);
header.writeUInt32LE(16, 16);
header.writeUInt16LE(1, 20);
header.writeUInt16LE(1, 22);
header.writeUInt32LE(SAMPLE_RATE, 24);
header.writeUInt32LE(SAMPLE_RATE * 2, 28);
header.writeUInt16LE(2, 32);
header.writeUInt16LE(16, 34);
header.write('data', 36);
header.writeUInt32LE(pcm.length, 40);

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, Buffer.concat([header, pcm]));
console.log('wrote', OUT, (pcm.length / 1024).toFixed(1) + 'KB');