import { useEffect } from 'react';
import { useLocation } from 'react-router';
import site from '../../site.config.json';
import { LANGS, swapLang, useI18n } from '../i18n/i18n';

const OG_LOCALE = { kk: 'kk_KZ', tr: 'tr_TR', ru: 'ru_RU' } as const;

function setMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.content = content;
}

function setLink(rel: string, href: string, hreflang?: string) {
  const sel = hreflang ? `link[rel="${rel}"][hreflang="${hreflang}"]` : `link[rel="${rel}"]:not([hreflang])`;
  let el = document.head.querySelector<HTMLLinkElement>(sel);
  if (!el) {
    el = document.createElement('link');
    el.rel = rel;
    if (hreflang) el.hreflang = hreflang;
    document.head.appendChild(el);
  }
  el.href = href;
}

/** Absolute URL of an app path ("/kk/entry/7"). */
export function absoluteUrl(pathname: string): string {
  const base = site.basePath.replace(/\/$/, '');
  return site.siteUrl.replace(/\/$/, '') + base + pathname;
}

/**
 * Keeps <title>, description, canonical, hreflang and Open Graph tags in sync
 * during client-side navigation. Static copies are written by scripts/prerender.mjs.
 */
export function usePageMeta(title: string, description: string) {
  const { t, lang } = useI18n();
  const { pathname } = useLocation();
  useEffect(() => {
    const siteTitle = t('site.title');
    const full = title ? `${title} — ${siteTitle}` : siteTitle;
    const url = absoluteUrl(pathname);
    document.title = full;
    setMeta('name', 'description', description);
    setMeta('property', 'og:title', full);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:url', url);
    setMeta('property', 'og:site_name', siteTitle);
    setMeta('property', 'og:locale', OG_LOCALE[lang]);
    setMeta('name', 'twitter:title', full);
    setMeta('name', 'twitter:description', description);
    setLink('canonical', url);
    for (const l of LANGS) setLink('alternate', absoluteUrl(swapLang(pathname, l)), l);
  }, [title, description, pathname, t, lang]);
}
