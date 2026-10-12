import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import type { Entry } from '../data/types';
import { fold, translit } from './text';

/**
 * Dictionary / map filters, kept in the URL so that "back" restores the same
 * selection and a link can be shared: ?q=…&type=cognate,partial&obj=hydronym&comp=ak
 */
export interface Filters {
  q: string;
  type: string[];
  obj: string[];
  comp: string[];
}

export type ListKey = 'type' | 'obj' | 'comp';

export function readFilters(p: URLSearchParams): Filters {
  const list = (k: string) => (p.get(k) ?? '').split(',').filter(Boolean);
  return {
    q: p.get('q') ?? '',
    // "link" was the parameter name in the first version of the site.
    type: list('type').length ? list('type') : list('link'),
    obj: list('obj'),
    comp: list('comp'),
  };
}

export function activeFilterCount(f: Filters): number {
  return (f.q.trim() ? 1 : 0) + f.type.length + f.obj.length + f.comp.length;
}

export function matchesQuery(e: Entry, q: string): boolean {
  const qf = fold(q.trim());
  if (!qf) return true;
  return e.haystack.includes(qf) || e.haystack.includes(translit(qf)) || e.haystack.includes(translit(qf, true));
}

/** OR within a group, AND between groups. */
export function applyFilters(list: Entry[], f: Filters): Entry[] {
  return list.filter(
    (e) =>
      matchesQuery(e, f.q) &&
      (!f.type.length || f.type.includes(e.link_type_draft)) &&
      (!f.obj.length || f.obj.includes(e.kzCat) || f.obj.includes(e.trCat)) &&
      (!f.comp.length || f.comp.some((c) => e.kzKeys.has(c) || e.trKeys.has(c))),
  );
}

export function useFilters() {
  const [params, setParams] = useSearchParams();
  const filters = useMemo(() => readFilters(params), [params]);

  const update = useCallback(
    (patch: Partial<Filters>) => {
      setParams(
        (prev) => {
          const p = new URLSearchParams(prev);
          p.delete('link');
          for (const [k, v] of Object.entries(patch)) {
            const s = Array.isArray(v) ? v.join(',') : (v ?? '');
            if (s) p.set(k, s);
            else p.delete(k);
          }
          return p;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  const toggle = useCallback(
    (key: ListKey, value: string) => {
      const cur = filters[key];
      update({ [key]: cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value] });
    },
    [filters, update],
  );

  const clear = useCallback(() => update({ q: '', type: [], obj: [], comp: [] }), [update]);

  return { filters, update, toggle, clear, params, setParams };
}
