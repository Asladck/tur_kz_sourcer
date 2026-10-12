/**
 * Post-build step: writes one static HTML file per route and language
 * (dist/kk/entry/7/index.html, dist/ru/map/index.html …) with its own <html lang>,
 * <title>, description, canonical, hreflang alternates and Open Graph / Twitter
 * tags, so every page has a real URL on any static host and a proper preview
 * when shared. Also writes 404.html, sitemap.xml and robots.txt.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const readJson = async (p) => JSON.parse(await readFile(join(root, p), 'utf8'));

const site = await readJson('site.config.json');
const LANGS = ['kk', 'tr', 'ru'];
const OG_LOCALE = { kk: 'kk_KZ', tr: 'tr_TR', ru: 'ru_RU' };
const dicts = Object.fromEntries(await Promise.all(LANGS.map(async (l) => [l, await readJson(`src/i18n/${l}.json`)])));
const data = await readJson('toponyms_kz_tr.json');
const template = await readFile(join(dist, 'index.html'), 'utf8');

const base = site.basePath.replace(/\/?$/, '/');
const origin = site.siteUrl.replace(/\/$/, '');
const abs = (path) => origin + base.replace(/\/$/, '') + path;
const fill = (s, vars) => s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

/** `rest` is the path after the language prefix ("" for home, "/map" …). */
function head({ lang, rest, title, description, type = 'website', noindex = false }) {
  const d = dicts[lang];
  const full = title ? `${title} — ${d.site.title}` : d.site.title;
  const url = abs(`/${lang}${rest}`);
  const image = abs('/og-image.png');
  return [
    `<title>${esc(full)}</title>`,
    `<meta name="description" content="${esc(description)}" />`,
    noindex ? '<meta name="robots" content="noindex" />' : `<link rel="canonical" href="${esc(url)}" />`,
    ...LANGS.map((l) => `<link rel="alternate" hreflang="${l}" href="${esc(abs(`/${l}${rest}`))}" />`),
    `<link rel="alternate" hreflang="x-default" href="${esc(abs(`/kk${rest}`))}" />`,
    `<meta property="og:type" content="${type}" />`,
    `<meta property="og:site_name" content="${esc(d.site.title)}" />`,
    `<meta property="og:title" content="${esc(full)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    `<meta property="og:url" content="${esc(url)}" />`,
    `<meta property="og:image" content="${esc(image)}" />`,
    '<meta property="og:image:width" content="1200" />',
    '<meta property="og:image:height" content="630" />',
    `<meta property="og:image:alt" content="${esc(LANGS.map((l) => dicts[l].site.title).join(' / '))}" />`,
    `<meta property="og:locale" content="${OG_LOCALE[lang]}" />`,
    ...LANGS.filter((l) => l !== lang).map((l) => `<meta property="og:locale:alternate" content="${OG_LOCALE[l]}" />`),
    '<meta name="twitter:card" content="summary_large_image" />',
    `<meta name="twitter:title" content="${esc(full)}" />`,
    `<meta name="twitter:description" content="${esc(description)}" />`,
    `<meta name="twitter:image" content="${esc(image)}" />`,
  ].join('\n    ');
}

const META_BLOCK = /<!--meta:start-->[\s\S]*?<!--meta:end-->/;
if (!META_BLOCK.test(template)) throw new Error('dist/index.html has no <!--meta:start--> … <!--meta:end--> block');

// Markers are kept so the script can be re-run on its own output.
const render = (meta) =>
  template
    .replace(/<html lang="[^"]*">/, `<html lang="${meta.lang}">`)
    .replace(META_BLOCK, `<!--meta:start-->\n    ${head(meta)}\n    <!--meta:end-->`);

// Both /kk/map/index.html and /kk/map.html, so that /kk/map works without a
// redirect on hosts that resolve either form (GitHub Pages, Netlify, nginx…).
async function write(path, html) {
  if (path === '/') return writeFile(join(dist, 'index.html'), html);
  await mkdir(join(dist, path), { recursive: true });
  await writeFile(join(dist, path, 'index.html'), html);
  await writeFile(join(dist, `${path}.html`), html);
}

const count = data.entries.length;
const PAGES = [
  { rest: '', key: 'home' },
  { rest: '/map', key: 'map' },
  { rest: '/dictionary', key: 'dictionary' },
  { rest: '/sounds', key: 'sounds' },
  { rest: '/history', key: 'history' },
  { rest: '/method', key: 'method' },
  { rest: '/method/stats', key: 'stats' },
  { rest: '/present', key: 'present', noindex: true },
];

const urls = [];
let written = 0;
for (const lang of LANGS) {
  const d = dicts[lang];
  for (const p of PAGES) {
    const meta = { lang, rest: p.rest, title: d.meta[p.key].title, description: fill(d.meta[p.key].description, { count }), noindex: p.noindex };
    await write(`/${lang}${p.rest}`, render(meta));
    written++;
    if (!p.noindex) urls.push(`/${lang}${p.rest}`);
  }
  for (const e of data.entries) {
    const vars = {
      id: e.id,
      kz: e.kz.name,
      tr: e.tr.name,
      kzCountry: d.common.kz,
      trCountry: d.common.tr,
      link: d.link[e.link_type_draft] ?? e.link_type_draft,
    };
    const rest = `/entry/${e.id}`;
    await write(`/${lang}${rest}`, render({ lang, rest, title: fill(d.meta.entry.title, vars), description: fill(d.meta.entry.description, vars), type: 'article' }));
    written++;
    urls.push(`/${lang}${rest}`);
  }
}

// The root URL redirects (client-side) to the remembered or default language.
await write('/', render({ lang: 'kk', rest: '', title: '', description: fill(dicts.kk.meta.home.description, { count }) }));
await writeFile(join(dist, '404.html'), render({ lang: 'kk', rest: '', title: dicts.kk.meta.notFound.title, description: dicts.kk.notFound.text, noindex: true }));

await writeFile(
  join(dist, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((u) => `  <url><loc>${esc(abs(u))}</loc></url>`)
    .join('\n')}\n</urlset>\n`,
);
await writeFile(join(dist, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${abs('/sitemap.xml')}\n`);

console.log(`prerender: ${written} pages in ${LANGS.length} languages, index.html, 404.html, sitemap.xml (${urls.length} URLs)`);
