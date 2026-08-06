// Script one-shot: gera os ícones PWA do EngeServ Inspector
// (PNG 192/512 + maskable + apple-touch + favicon) a partir do design
// em código, sem dependências externas (zlib nativo do Node).
//
// Uso: node scripts/generate-icons.mjs
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const OUT = join(process.cwd(), "public", "icons");
mkdirSync(OUT, { recursive: true });

// ---------- Paleta da marca ----------
const NAVY = [0x1f, 0x38, 0x64, 255];
const BLUE = [0x2e, 0x74, 0xb5, 255];
const WHITE = [0xff, 0xff, 0xff, 255];

function hex(h) { return h.replace("#", ""); }

// ---------- PNG encoder (RGBA8 não-interlaced) ----------
function crc32(buf) {
  let table = crc32.table;
  if (!table) {
    table = crc32.table = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c;
    }
  }
  let crc = -1;
  for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  return (crc ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crc]);
}

function encodePNG(width, height, rgba) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type RGBA
  // raw scanlines with filter byte 0
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ---------- Desenho (mesmo design do SVG) ----------
function drawIcon(size) {
  const buf = Buffer.alloc(size * size * 4);
  const s = size;
  const set = (x, y, c) => {
    if (x < 0 || y < 0 || x >= s || y >= s) return;
    const i = (y * s + x) * 4;
    const a = c[3];
    // alpha blend sobre o que já existe
    const na = a + (buf[i + 3] * (255 - a)) / 255;
    if (na === 0) return;
    buf[i] = (c[0] * a + buf[i] * (255 - a)) / 255;
    buf[i + 1] = (c[1] * a + buf[i + 1] * (255 - a)) / 255;
    buf[i + 2] = (c[2] * a + buf[i + 2] * (255 - a)) / 255;
    buf[i + 3] = na;
  };
  const fillRect = (x0, y0, w, h, c) => {
    for (let y = y0; y < y0 + h; y++)
      for (let x = x0; x < x0 + w; x++) set(x, y, c);
  };
  const fillCircle = (cx, cy, r, c) => {
    for (let y = cy - r; y <= cy + r; y++)
      for (let x = cx - r; x <= cx + r; x++) {
        const dx = x - cx, dy = y - cy;
        if (dx * dx + dy * dy <= r * r) set(x, y, c);
      }
  };
  const strokeCircle = (cx, cy, r, w, c) => {
    for (let y = cy - r - w; y <= cy + r + w; y++)
      for (let x = cx - r - w; x <= cx + r + w; x++) {
        const d = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
        if (d >= r - w / 2 && d <= r + w / 2) set(x, y, c);
      }
  };
  // triângulo / chevron helpers via linhas grossas
  const drawLine = (x0, y0, x1, y1, w, c) => {
    const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = Math.round(x0 + (x1 - x0) * t);
      const y = Math.round(y0 + (y1 - y0) * t);
      fillCircle(x, y, w / 2, c);
    }
  };
  const drawPoly = (pts, c) => {
    for (let i = 0; i < pts.length - 1; i++) {
      const [ax, ay] = pts[i], [bx, by] = pts[i + 1];
      drawLine(ax, ay, bx, by, s / 32, c);
    }
  };

  // fundo navy (full-bleed para maskable)
  fillRect(0, 0, s, s, NAVY);

  // anel interno
  const ringPad = s * 0.05;
  strokeCircle(s / 2, s / 2, s / 2 - ringPad, s * 0.02, [BLUE[0], BLUE[1], BLUE[2], 90]);

  // chevrons (capacete de engenheiro / inspeção)
  const p = s / 512;
  drawPoly([
    [256 * p, 112 * p], [96 * p, 232 * p], [96 * p, 272 * p],
    [256 * p, 152 * p], [416 * p, 272 * p], [416 * p, 232 * p],
  ], WHITE);
  drawPoly([
    [256 * p, 176 * p], [128 * p, 304 * p], [128 * p, 344 * p],
    [256 * p, 216 * p], [384 * p, 344 * p], [384 * p, 304 * p],
  ], BLUE);

  // barra / mostrador
  fillRect(176 * p, 360 * p, 160 * p, 16 * p, WHITE);
  strokeCircle(356 * p, 368 * p, 26 * p, 10 * p, WHITE);
  fillCircle(356 * p, 368 * p, 26 * p, BLUE);
  fillCircle(356 * p, 368 * p, 9 * p, WHITE);

  return buf;
}

const targets = [
  ["icon-192.png", 192],
  ["icon-512.png", 512],
  ["maskable-192.png", 192],
  ["maskable-512.png", 512],
  ["apple-touch-icon.png", 180],
  ["favicon-96.png", 96],
];

for (const [name, size] of targets) {
  const png = encodePNG(size, size, drawIcon(size));
  writeFileSync(join(OUT, name), png);
  console.log(`✓ ${name} (${size}x${size}) — ${png.length} bytes`);
}
