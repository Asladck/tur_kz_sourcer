import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { interpolate } from '../lib/text';
import kk from './kk.json';
import ru from './ru.json';
import tr from './tr.json';

export type Lang = 'kk' | 'tr' | 'ru';
export const LANGS: Lang[] = ['kk', 'tr', 'ru'];
export const LANG_LABEL: Record<Lang, string> = { kk: 'ҚАЗ', tr: 'TÜR', ru: 'РУС' };
export const LANG_NAME: Record<Lang, string> = { kk: 'Қазақша', tr: 'Türkçe', ru: 'Русский' };
const LOCALE: Record<Lang, string> = { kk: 'kk-KZ', tr: 'tr-TR', ru: 'ru-RU' };
const DICTS: Record<Lang, unknown> = { kk, tr, ru };
const STORAGE_KEY = 'kztr-lang';

export const isLang = (s: string | undefined): s is Lang => !!s && (LANGS as string[]).includes(s);

/** Language remembered from the last visit (the URL always wins). */
export function preferredLang(): Lang {
  try {
    const s = localStorage.getItem(STORAGE_KEY) ?? undefined;
    if (isLang(s)) return s;
  } catch {
    /* storage unavailable */
  }
  return 'kk';
}

function remember(l: Lang) {
  try {
    localStorage.setItem(STORAGE_KEY, l);
  } catch {
    /* ignore */
  }
}

function lookup(dict: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((o, k) => (o && typeof o === 'object' ? (o as Record<string, unknown>)[k] : undefined), dict);
}

/** Replaces the language segment of a router path: "/kk/map" → "/ru/map". */
export function swapLang(pathname: string, l: Lang): string {
  const rest = pathname.replace(/^\/[^/]+/, '');
  return `/${l}${rest}`;
}

interface I18n {
  lang: Lang;
  locale: string;
  /**
   * Translates a UI string. A locale value may be a plural object
   * ({ one, few, many, other }), chosen by `vars.n`.
   */
  t: (key: string, vars?: Record<string, string | number>) => string;
  /** Raw access for arrays / objects in the locale files. */
  get: <T = unknown>(key: string) => T | undefined;
  /** Prefixes an app path with the current language: lp('/map') → '/kk/map'. */
  lp: (path: string) => string;
}

const Ctx = createContext<I18n | null>(null);

export function I18nProvider({ lang, children }: { lang: Lang; children: ReactNode }) {
  useEffect(() => {
    document.documentElement.lang = lang;
    remember(lang);
  }, [lang]);

  const value = useMemo<I18n>(() => {
    const dict = DICTS[lang];
    const locale = LOCALE[lang];
    const plural = new Intl.PluralRules(locale);
    return {
      lang,
      locale,
      t: (key, vars) => {
        let v = lookup(dict, key);
        if (v && typeof v === 'object' && !Array.isArray(v) && 'other' in v) {
          const forms = v as Record<string, string>;
          v = forms[plural.select(Number(vars?.n ?? 0))] ?? forms.other;
        }
        return typeof v === 'string' ? interpolate(v, vars) : key;
      },
      get: <T,>(key: string) => lookup(dict, key) as T | undefined,
      lp: (path) => `/${lang}${path === '/' ? '' : path}`,
    };
  }, [lang]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n(): I18n {
  const v = useContext(Ctx);
  if (!v) throw new Error('useI18n outside I18nProvider');
  return v;
}
