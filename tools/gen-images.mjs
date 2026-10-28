// Generates the demo sock PNGs (pure Node, no dependencies): node tools/gen-images.mjs
import zlib from 'node:zlib';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const W = 320, H = 320;
const out = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'backend', 'seed-images');

const chunk = (type, data) => {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(zlib.crc32(body));
  return Buffer.concat([len, body, crc]);
};

function png(pixel) {
  const raw = Buffer.alloc((W * 3 + 1) * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const o = y * (W * 3 + 1) + 1 + x * 3;
    raw.set(pixel(x, y), o);
  }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4); ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const BG = hex('#F6E6D1');
// name, body colour, accent colour, pattern
const socks = [
  ['red-stripes', '#ED2939', '#FFFFFF', 'stripes'],
  ['navy-dots', '#1F3A68', '#F6E6D1', 'dots'],
  ['forest-plain', '#2F6B4F', '#E9C46A', 'plain'],
  ['mustard-stripes', '#E9A820', '#3B2A20', 'stripes'],
  ['pink-dots', '#E58FA8', '#FFFFFF', 'dots'],
  ['grey-plain', '#7A7F87', '#ED2939', 'plain'],
  ['sky-stripes', '#5BA4D8', '#FFFFFF', 'stripes'],
  ['plum-dots', '#6B2D5C', '#F2C6DE', 'dots'],
];

for (const [name, body, accent, pattern] of socks) {
  const b = hex(body), a = hex(accent);
  const inLeg = (x, y) => x >= 110 && x <= 200 && y >= 40 && y <= 190;
  const inFoot = (x, y) => y >= 160 && y <= 240 && x >= 110 && x <= 265 && ((x - 200) ** 2 / 65 ** 2 + (y - 200) ** 2 / 40 ** 2 <= 1 || x <= 200);
  const file = png((x, y) => {
    if (!inLeg(x, y) && !inFoot(x, y)) return BG;
    if (y < 72) return a; // cuff
    if (pattern === 'stripes') return Math.floor(y / 14) % 2 ? a : b;
    if (pattern === 'dots') return (x % 24 - 12) ** 2 + (y % 24 - 12) ** 2 < 16 ? a : b;
    return y > 215 || (x > 235 && y > 190) ? a : b; // plain: contrasting sole
  });
  fs.writeFileSync(path.join(out, `${name}.png`), file);
}
console.log(`wrote ${socks.length} images to ${out}`);
