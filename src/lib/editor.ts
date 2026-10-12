import { useEffect, useState } from 'react';
import { useLocation } from 'react-router';

const KEY = 'kztr-editor';

function read(search: string): boolean {
  const q = new URLSearchParams(search).get('editor');
  try {
    if (q === '1') sessionStorage.setItem(KEY, '1');
    if (q === '0') sessionStorage.removeItem(KEY);
    return sessionStorage.getItem(KEY) === '1';
  } catch {
    return q === '1';
  }
}

/**
 * Editor mode: enabled with ?editor=1, kept for the browser tab session,
 * disabled with ?editor=0. It only hides UI — the data itself is public.
 */
export function useEditor(): boolean {
  const { search } = useLocation();
  const [on, setOn] = useState(() => read(search));
  useEffect(() => setOn(read(search)), [search]);
  return on;
}
