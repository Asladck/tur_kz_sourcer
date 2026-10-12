/**
 * Glyph coverage check: every character the site can display must be drawn by
 * one of the bundled Noto fonts, otherwise the browser silently falls back to
 * a system font ("tofu" squares in the worst case). Run: `npm run check:glyphs`.
 *
 * A character counts as covered only if some @font-face of the font stack both
 * lists it in its unicode-range AND actually contains a glyph for it — the
 * cmap table is read from the woff2 file itself (a unicode-range alone is not
 * enough: the Noto Serif "math" subset claims → and ↔ but has no glyphs).
 *
 * Checked: all locale strings, every text field of toponyms_kz_tr.json and all
 * non-ASCII characters in the source code. Characters replaced before display
 * (displayText in src/lib/text.ts, inline-SVG arrows in <Txt>) are listed separately.
 */
import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { brotliDecompressSync } from 'node:zlib';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// ── woff2 → set of code points (cmap formats 4 and 12) ──────────────────

function readBase128(buf, pos) {
  let v = 0;
  for (let i = 0; i < 5; i++) {
    const b = buf[pos.p++];
    v = v * 128 + (b & 0x7f);
    if (!(b & 0x80)) return v;
  }
  throw new Error('bad UIntBase128');
}

function woff2Cmap(buf) {
  if (buf.toString('latin1', 0, 4) !== 'wOF2') throw new Error('not woff2');
  const numTables = buf.readUInt16BE(12);
  const pos = { p: 48 };
  const tables = [];
  for (let i = 0; i < numTables; i++) {
    const flags = buf[pos.p++];
    const tagIndex = flags & 0x3f;
    const version = flags >> 6;
    let tag = tagIndex;
    if (tagIndex === 63) {
      tag = buf.toString('latin1', pos.p, pos.p + 4);
      pos.p += 4;
    }
    const origLength = readBase128(buf, pos);
    // glyf (10) / loca (11): version 0 = transformed; others: version ≠ 0 = transformed.
    const transformed = tagIndex === 10 || tagIndex === 11 ? version === 0 : version !== 0;
    const length = transformed ? readBase128(buf, pos) : origLength;
    tables.push({ tag, length });
  }
  const data = brotliDecompressSync(buf.subarray(pos.p));
  let off = 0;
  for (const t of tables) {
    if (t.tag === 0) return parseCmap(data.subarray(off, off + t.length));
    off += t.length;
  }
  throw new Error('no cmap');
}

function parseCmap(c) {
  const n = c.readUInt16BE(2);
  const subs = [];
  for (let i = 0; i < n; i++) {
    const r = 4 + i * 8;
    subs.push({ pid: c.readUInt16BE(r), eid: c.readUInt16BE(r + 2), off: c.readUInt32BE(r + 4) });
  }
  const set = new Set();
  const f12 = subs.find((s) => c.readUInt16BE(s.off) === 12);
  if (f12) {
    const groups = c.readUInt32BE(f12.off + 12);
    for (let g = 0; g < groups; g++) {
      const b = f12.off + 16 + g * 12;
      const [s, e, gid] = [c.readUInt32BE(b), c.readUInt32BE(b + 4), c.readUInt32BE(b + 8)];
      for (let cp = s; cp <= e; cp++) if (gid + (cp - s) !== 0) set.add(cp);
    }
    return set;
  }
  const f4 = subs.find((s) => c.readUInt16BE(s.off) === 4);
  if (!f4) return set;
  const o = f4.off;
  const segX2 = c.readUInt16BE(o + 6);
  const ends = o + 14;
  const starts = ends + segX2 + 2;
  const deltas = starts + segX2;
  const ranges = deltas + segX2;
  for (let i = 0; i < segX2 / 2; i++) {
    const end = c.readUInt16BE(ends + i * 2);
    const start = c.readUInt16BE(starts + i * 2);
    const delta = c.readInt16BE(deltas + i * 2);
    const ro = c.readUInt16BE(ranges + i * 2);
    for (let cp = start; cp <= end && cp !== 0xffff; cp++) {
      let gid;
      if (ro === 0) gid = (cp + delta) & 0xffff;
      else {
        const g = c.readUInt16BE(ranges + i * 2 + ro + (cp - start) * 2);
        gid = g === 0 ? 0 : (g + delta) & 0xffff;
      }
      if (gid !== 0) set.add(cp);
    }
  }
  return set;
}

// ── @font-face blocks of a fontsource package ───────────────────────────

async function faces(cssFile) {
  const cssPath = join(root, 'node_modules', cssFile);
  const css = await readFile(cssPath, 'utf8');
  const out = [];
  for (const block of css.match(/@font-face\s*{[^}]*}/g) ?? []) {
    const file = block.match(/url\(\s*['"]?([^'")]+\.woff2)['"]?\s*\)/)?.[1];
    if (!file) continue;
    const ranges = [];
    for (const part of (block.match(/unicode-range:\s*([^;]+);/)?.[1] ?? 'U+0-10FFFF').split(',')) {
      const [a, b] = part.trim().replace(/^U\+/i, '').split('-');
      ranges.push([parseInt(a, 16), b ? parseInt(b, 16) : parseInt(a, 16)]);
    }
    const cmap = woff2Cmap(await readFile(join(dirname(cssPath), file)));
    out.push({ file, ranges, cmap });
  }
  return out;
}

// Font stacks as in src/styles/global.css; CSS files as imported in src/main.tsx.
const FONTS = {
  sans: '@fontsource-variable/noto-sans/index.css',
  serif: '@fontsource-variable/noto-serif/index.css',
  armenian: '@fontsource-variable/noto-sans-armenian/index.css',
  mono: '@fontsource-variable/noto-sans-mono/index.css',
};
const loaded = Object.fromEntries(await Promise.all(Object.entries(FONTS).map(async ([k, p]) => [k, await faces(p)])));
const STACK_TEXT = ['sans', 'serif', 'armenian'];
const STACK_SERIF = ['serif', 'sans', 'armenian'];

function coveredBy(stack, cp) {
  for (const name of stack) {
    for (const f of loaded[name]) {
      if (f.ranges.some(([lo, hi]) => cp >= lo && cp <= hi) && f.cmap.has(cp)) return name;
    }
  }
  return null;
}

// Characters replaced at display time: DISPLAY_MAP in src/lib/text.ts (U+F0B7 → •,
// ➔ → →) and the arrows the <Txt> component draws as inline SVG (src/components/ui.tsx).
const DISPLAY_MAPPED = new Set([0xf0b7, 0x2794, 0x2190, 0x2192, 0x2194]);

// ── collect every character the site can show ───────────────────────────

const found = new Map(); // char → Set(where)
const note = (text, where) => {
  for (const ch of String(text)) {
    if (/\s/.test(ch) || ch.codePointAt(0) < 0x20) continue;
    if (!found.has(ch)) found.set(ch, new Set());
    if (found.get(ch).size < 4) found.get(ch).add(where);
  }
};

function walk(value, where) {
  if (typeof value === 'string') note(value, where);
  else if (Array.isArray(value)) value.forEach((v, i) => walk(v, `${where}[${i}]`));
  else if (value && typeof value === 'object') for (const [k, v] of Object.entries(value)) walk(v, `${where}.${k}`);
}

for (const lang of ['kk', 'tr', 'ru']) walk(JSON.parse(await readFile(join(root, `src/i18n/${lang}.json`), 'utf8')), lang);
const data = JSON.parse(await readFile(join(root, 'toponyms_kz_tr.json'), 'utf8'));
for (const e of data.entries) walk(e, `entry ${e.id}`);
walk(data.meta, 'meta');

async function* files(dir) {
  for (const d of await readdir(join(root, dir), { withFileTypes: true })) {
    const p = join(dir, d.name);
    if (d.isDirectory()) yield* files(p);
    else if (/\.(tsx?|css)$/.test(d.name)) yield p;
  }
}
for await (const f of files('src')) {
  // Comments are never displayed; only non-ASCII code characters matter here.
  const code = (await readFile(join(root, f), 'utf8')).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  for (const ch of code) if (ch.codePointAt(0) > 0x7f) note(ch, f);
}

// Place names are set in the serif face.
const serifChars = new Set();
for (const e of data.entries) for (const s of [e.kz.name, e.tr.name]) for (const ch of s) serifChars.add(ch);

let problems = 0;
const mapped = [];
const byFont = {};
for (const [ch, where] of [...found].sort()) {
  const cp = ch.codePointAt(0);
  const hex = `U+${cp.toString(16).toUpperCase().padStart(4, '0')}`;
  if (DISPLAY_MAPPED.has(cp)) {
    mapped.push(`${hex} «${ch}» → mapped at display (${[...where].join('; ')})`);
    continue;
  }
  const text = coveredBy(STACK_TEXT, cp);
  const serif = serifChars.has(ch) ? coveredBy(STACK_SERIF, cp) : 'n/a';
  if (text) byFont[text] = (byFont[text] ?? 0) + 1;
  if (!text || !serif) {
    problems++;
    console.log(`MISSING ${hex} «${ch}» text:${text} serif:${serif} — ${[...where].join('; ')}`);
  }
}
for (const t of ['•']) {
  if (!coveredBy(STACK_TEXT, t.codePointAt(0))) {
    problems++;
    console.log(`MISSING display replacement «${t}»`);
  }
}
console.log(`checked ${found.size} distinct characters against the fonts' own glyph tables; ${problems} not covered`);
console.log(`drawn by: ${Object.entries(byFont).map(([k, v]) => `${k} ${v}`).join(', ')}`);
if (mapped.length) console.log(`display-mapped:\n  ${mapped.join('\n  ')}`);
process.exit(problems ? 1 : 0);
