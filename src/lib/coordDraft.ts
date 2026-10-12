import { data } from '../data/dataset';
import type { SideKey } from '../data/types';

/**
 * Coordinates entered in editor mode (?editor=1) by clicking on the map.
 * Kept in this browser's localStorage until exported as an updated
 * toponyms_kz_tr.json — nothing is invented or filled automatically.
 */
export type LatLon = [number, number];
export type Draft = Record<number, Partial<Record<SideKey, LatLon>>>;

const KEY = 'kztr-coord-draft';

export function loadDraft(): Draft {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? '{}');
    return v && typeof v === 'object' ? (v as Draft) : {};
  } catch {
    return {};
  }
}

export function saveDraft(d: Draft) {
  try {
    if (Object.keys(d).length) localStorage.setItem(KEY, JSON.stringify(d));
    else localStorage.removeItem(KEY);
  } catch {
    /* storage unavailable: the draft lives until the tab is closed */
  }
}

export function draftCount(d: Draft): number {
  return Object.values(d).reduce((n, s) => n + Object.keys(s).length, 0);
}

/** ~1 m precision is plenty for a toponym. */
const round = (n: number) => Math.round(n * 1e5) / 1e5;

/**
 * The source JSON with drafted lat/lon applied. Everything else — order of
 * keys, all other fields, 2-space formatting — is kept as in the original file.
 */
export function exportJson(d: Draft): string {
  const out = structuredClone(data);
  for (const e of out.entries) {
    const sides = d[e.id];
    if (!sides) continue;
    for (const side of ['kz', 'tr'] as const) {
      const c = sides[side];
      if (c) {
        e[side].lat = round(c[0]);
        e[side].lon = round(c[1]);
      }
    }
  }
  return JSON.stringify(out, null, 2);
}
