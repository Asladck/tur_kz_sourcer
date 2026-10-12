const KZ_FOLD: Record<string, string> = {
  ә: 'а', ғ: 'г', қ: 'к', ң: 'н', ө: 'о', ұ: 'у', ү: 'у', һ: 'х', і: 'и', ё: 'е',
};

const CYR_TO_LAT: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ж: 'j', з: 'z', и: 'i', й: 'y',
  к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u',
  ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sh', ъ: '', ы: 'i', ь: '', э: 'e',
  ю: 'yu', я: 'ya',
};

/**
 * Case- and diacritic-insensitive form for searching: "Ақкөл" → "аккол",
 * "Akgöl" → "akgol", "İkiztepe" → "ikiztepe".
 */
export function fold(s: string): string {
  return s
    .replace(/[İI]/g, 'i')
    .toLowerCase()
    .replace(/ı/g, 'i')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[әғқңөұүһіё]/g, (c) => KZ_FOLD[c] ?? c);
}

/**
 * Rough Cyrillic → Latin transliteration of an already folded string.
 * "ы" is rendered as "i" (Turkish-style: қызыл → kizil) or, with yForY, as
 * "y" (Kazakh Latin: Ұлытау → ulytau).
 */
export function translit(folded: string, yForY = false): string {
  return folded.replace(/[а-я]/g, (c) => (yForY && c === 'ы' ? 'y' : (CYR_TO_LAT[c] ?? c)));
}

/**
 * Display-only fixes for characters no bundled font can draw (the data is not
 * changed): U+F0B7 is a Word "Symbol" bullet in the private-use area,
 * U+2794 a heavy arrow from Wingdings. Keep in sync with scripts/check-glyphs.mjs.
 */
const DISPLAY_MAP: Record<string, string> = { '\uF0B7': '•', '\u2794': '→' };

export function displayText(s: string): string {
  return s.replace(/[\uF0B7\u2794]/g, (c) => DISPLAY_MAP[c] ?? c);
}

export function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
}
