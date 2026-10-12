import { componentLabel, countWithKey, entries } from '../data/dataset';
import { LEXICON } from '../data/morphology';
import type { Entry } from '../data/types';
import { fold, translit } from './text';

const components = Object.entries(LEXICON)
  .map(([key, item]) => ({ key, label: componentLabel(key), forms: [...item.kz, ...item.tr].map(fold), count: countWithKey(key) }))
  .filter((c) => c.count > 0);

const names = entries.map((e) => {
  const fk = fold(e.kz.name);
  const ft = fold(e.tr.name);
  return { e, variants: [fk, ft, translit(fk), translit(fk, true)] };
});

export interface SearchResults {
  entries: Entry[];
  components: { key: string; label: string; count: number }[];
}

/**
 * Global search over KZ / TR names (diacritic- and script-insensitive), entry
 * numbers and components (ақ, göl…). Pairs containing a matched component are
 * included after direct name matches.
 */
export function globalSearch(query: string, limit = 8): SearchResults {
  const qf = fold(query.trim());
  if (!qf) return { entries: [], components: [] };
  const qs = [...new Set([qf, translit(qf), translit(qf, true)])];

  const comps = components
    .map((c) => ({ c, exact: c.forms.some((f) => qs.includes(f)), prefix: c.forms.some((f) => qs.some((x) => f.startsWith(x))) }))
    .filter((x) => x.exact || (x.prefix && qf.length >= 2))
    .sort((a, b) => Number(b.exact) - Number(a.exact) || b.c.count - a.c.count);
  const exactKeys = new Set(comps.filter((x) => x.exact).map((x) => x.c.key));

  const scored = names
    .map(({ e, variants }) => {
      let s = 0;
      if (/^\d+$/.test(qf) && e.id === Number(qf)) s = 1000;
      for (const v of variants) {
        for (const x of qs) {
          if (v === x) s = Math.max(s, 500);
          else if (v.startsWith(x)) s = Math.max(s, 300);
          else if (v.includes(x)) s = Math.max(s, 100);
        }
      }
      for (const k of exactKeys) if (e.kzKeys.has(k) || e.trKeys.has(k)) s = Math.max(s, 200);
      return { e, s };
    })
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || a.e.id - b.e.id);

  return {
    entries: scored.slice(0, limit).map((x) => x.e),
    components: comps.slice(0, 4).map(({ c }) => ({ key: c.key, label: c.label, count: c.count })),
  };
}
