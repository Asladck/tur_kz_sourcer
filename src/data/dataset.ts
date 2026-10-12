import raw from '../../toponyms_kz_tr.json';
import { fold, translit } from '../lib/text';
import { LEXICON, SEGMENTS } from './morphology';
import {
  LINK_TYPES,
  type Entry,
  type LinkType,
  type Morph,
  type ObjCat,
  type RawData,
  type RawEntry,
  type SideKey,
} from './types';

export const data = raw as unknown as RawData;
export const meta = data.meta;

export function objCategory(type: string | null): ObjCat {
  const t = (type ?? '').toLowerCase();
  if (t.startsWith('ойконим')) return 'oikonym';
  if (t.startsWith('гидроним')) return 'hydronym';
  if (t.startsWith('ороним')) return 'oronym';
  if (t.startsWith('хороним')) return 'choronym';
  return 'unspecified';
}

function lower(s: string, side: SideKey): string {
  return s.trim().replace(/^-/, '').toLocaleLowerCase(side === 'tr' ? 'tr' : 'kk');
}

const formIndex: Record<SideKey, Map<string, string>> = { kz: new Map(), tr: new Map() };
for (const [key, item] of Object.entries(LEXICON)) {
  for (const f of item.kz) formIndex.kz.set(f, key);
  for (const f of item.tr) formIndex.tr.set(f, key);
}

function parseSide(spec: string | undefined, name: string, side: SideKey): Morph[] {
  const parts = spec ? spec.split('|') : [name];
  const morphs = parts.map((p): Morph => {
    const m = p.match(/^(.*)\{([^}]+)\}$/);
    const text = m ? m[1] : p;
    const norm = lower(text, side);
    const key = m ? m[2] : (formIndex[side].get(norm) ?? `${side}:${norm}`);
    return { text, key, pair: null, mode: null };
  });
  if (import.meta.env.DEV && morphs.map((m) => m.text).join('') !== name) {
    console.warn(`[morphology] segmentation "${spec}" does not match name "${name}"`);
  }
  return morphs;
}

function segment(e: RawEntry) {
  const spec = SEGMENTS[e.id];
  const kz = parseSide(spec?.[0], e.kz.name, 'kz');
  const tr = parseSide(spec?.[1], e.tr.name, 'tr');
  let pair = 0;
  // Shared roots: identical lexicon keys on both sides.
  for (const a of kz) {
    if (a.key.includes(':')) continue;
    const b = tr.find((m) => m.pair === null && m.key === a.key);
    if (b) {
      a.pair = b.pair = pair++;
      a.mode = b.mode = 'shared';
    }
  }
  // Semantic equivalents listed explicitly.
  for (const link of (spec?.[2] ?? '').split(/\s+/).filter(Boolean)) {
    const [i, j] = link.split('-').map(Number);
    const a = kz[i];
    const b = tr[j];
    if (a && b && a.pair === null && b.pair === null) {
      a.pair = b.pair = pair++;
      a.mode = b.mode = 'semantic';
    }
  }
  // Number pairs left-to-right along the KZ name so colours read in order.
  const order = kz.filter((m) => m.pair !== null).map((m) => m.pair as number);
  const remap = new Map(order.map((p, idx) => [p, idx]));
  for (const m of [...kz, ...tr]) if (m.pair !== null) m.pair = remap.get(m.pair) ?? m.pair;
  return { kz, tr };
}

export const entries: Entry[] = data.entries.map((e) => {
  const seg = segment(e);
  const fk = fold(e.kz.name);
  const ft = fold(e.tr.name);
  return {
    ...e,
    link: (LINK_TYPES as readonly string[]).includes(e.link_type_draft) ? (e.link_type_draft as LinkType) : null,
    kzCat: objCategory(e.kz.type),
    trCat: objCategory(e.tr.type),
    seg,
    kzKeys: new Set(seg.kz.map((m) => m.key)),
    trKeys: new Set(seg.tr.map((m) => m.key)),
    haystack: [fk, ft, translit(fk), translit(fk, true), String(e.id)].join(' '),
  };
});

const byId = new Map(entries.map((e) => [e.id, e]));
export const getEntry = (id: number) => byId.get(id);

export function neighbours(id: number) {
  const i = entries.findIndex((e) => e.id === id);
  return { prev: entries[i - 1], next: entries[i + 1], index: i };
}

export function hasCoords(s: { lat: number | null; lon: number | null }) {
  return typeof s.lat === 'number' && typeof s.lon === 'number';
}

/** Label of a component key, e.g. "ақ / ak", "-лы / -lı", "köy". */
export function componentLabel(key: string): string {
  const item = LEXICON[key];
  if (item) return item.label ?? `${item.kz[0]} / ${item.tr[0]}`;
  return key.replace(/^(kz|tr):/, '');
}

/** Entries where a lexicon key occurs on both sides. */
export function entriesWithShared(key: string) {
  return entries.filter((e) => e.kzKeys.has(key) && e.trKeys.has(key));
}

export function countBy<T extends string>(items: T[]): Map<T, number> {
  const m = new Map<T, number>();
  for (const it of items) m.set(it, (m.get(it) ?? 0) + 1);
  return m;
}

export const linkCounts = countBy(entries.map((e) => e.link_type_draft));

/** Component frequency: number of KZ / TR names containing each component. */
export function componentFrequency() {
  const rows = new Map<string, { key: string; kz: number; tr: number }>();
  const bump = (key: string, side: SideKey) => {
    const norm = key.replace(/^(kz|tr):/, '');
    const id = key.includes(':') ? `${side}:${norm}` : key;
    const r = rows.get(id) ?? { key: id, kz: 0, tr: 0 };
    r[side] += 1;
    rows.set(id, r);
  };
  for (const e of entries) {
    for (const k of e.kzKeys) bump(k, 'kz');
    for (const k of e.trKeys) bump(k, 'tr');
  }
  return [...rows.values()].sort((a, b) => b.kz + b.tr - (a.kz + a.tr) || a.key.localeCompare(b.key));
}

/** Footnote-style markers such as "[13]" found in text fields. */
export function referenceMarkers() {
  const found = new Map<string, { id: number; side: SideKey; field: string }[]>();
  const fields = ['location', 'structure', 'etymology'] as const;
  for (const e of entries) {
    for (const side of ['kz', 'tr'] as const) {
      for (const f of fields) {
        const text = e[side][f] ?? '';
        for (const m of text.matchAll(/\[(\d{1,3})\]|(?<!\d)(\d{1,3})\](?!\()/g)) {
          const n = m[1] ?? m[2];
          const list = found.get(n) ?? [];
          list.push({ id: e.id, side, field: f });
          found.set(n, list);
        }
      }
    }
  }
  return [...found.entries()].sort((a, b) => Number(a[0]) - Number(b[0]));
}

/** Sources gathered from meta and from every entry's sources[] (as stored). */
export function allSources() {
  const out: { value: unknown; ids: number[] }[] = [];
  const push = (value: unknown, id?: number) => {
    const k = JSON.stringify(value);
    const found = out.find((o) => JSON.stringify(o.value) === k);
    if (found) {
      if (id !== undefined) found.ids.push(id);
    } else out.push({ value, ids: id !== undefined ? [id] : [] });
  };
  for (const s of meta.sources ?? []) push(s);
  for (const e of entries) for (const s of e.sources ?? []) push(s, e.id);
  return out;
}

export function sourceToText(s: unknown): string {
  if (typeof s === 'string') return s;
  if (s && typeof s === 'object') {
    const o = s as Record<string, unknown>;
    const parts = [o.author, o.title, o.year, o.pages, o.url].filter(Boolean).map(String);
    if (parts.length) return parts.join('. ');
  }
  return JSON.stringify(s);
}

/** Suffixes are too common to make two pairs "similar". */
const WEAK_KEYS = new Set(['li', 'lar', 'ci', 'ce']);

/**
 * Pairs that share a component (lexicon key) with the given one, best first:
 * more shared components, then the same link type, then the nearest number.
 */
export function similarEntries(e: Entry, n = 4): { entry: Entry; keys: string[] }[] {
  const mine = new Set([...e.kzKeys, ...e.trKeys].filter((k) => !k.includes(':') && !WEAK_KEYS.has(k)));
  if (!mine.size) return [];
  return entries
    .filter((o) => o.id !== e.id)
    .map((o) => ({ entry: o, keys: [...mine].filter((k) => o.kzKeys.has(k) || o.trKeys.has(k)) }))
    .filter((x) => x.keys.length > 0)
    .sort(
      (a, b) =>
        b.keys.length - a.keys.length ||
        Number(b.entry.link === e.link) - Number(a.entry.link === e.link) ||
        Math.abs(a.entry.id - e.id) - Math.abs(b.entry.id - e.id),
    )
    .slice(0, n);
}

/** Number of pairs whose KZ or TR name contains the component. */
export function countWithKey(key: string): number {
  return entries.filter((e) => e.kzKeys.has(key) || e.trKeys.has(key)).length;
}
