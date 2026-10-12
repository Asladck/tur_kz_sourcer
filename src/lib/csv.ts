import type { Entry } from '../data/types';

const SEP = ';';

function cell(v: unknown): string {
  if (v === null || v === undefined) return '';
  const s = String(v);
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** CSV of entries exactly as stored in the JSON (no translation). */
export function entriesToCsv(rows: Entry[], withReview: boolean): string {
  const header = [
    'id', 'link_type_draft', 'verified',
    'kz_name', 'kz_type', 'kz_location', 'kz_structure', 'kz_etymology', 'kz_lat', 'kz_lon',
    'tr_name', 'tr_type', 'tr_location', 'tr_structure', 'tr_etymology', 'tr_lat', 'tr_lon',
    'sources',
    ...(withReview ? ['review_notes', 'tr_name_in_source'] : []),
  ];
  const lines = rows.map((e) =>
    [
      e.id, e.link_type_draft, e.verified,
      e.kz.name, e.kz.type, e.kz.location, e.kz.structure, e.kz.etymology, e.kz.lat, e.kz.lon,
      e.tr.name, e.tr.type, e.tr.location, e.tr.structure, e.tr.etymology, e.tr.lat, e.tr.lon,
      e.sources.length ? JSON.stringify(e.sources) : '',
      ...(withReview ? [e.review_notes, e.tr.name_in_source] : []),
    ].map(cell).join(SEP),
  );
  return [header.join(SEP), ...lines].join('\r\n');
}

export function downloadText(filename: string, text: string, mime = 'text/csv;charset=utf-8') {
  // CSV gets a BOM so that Excel opens UTF-8 (Kazakh / Turkish letters) correctly.
  const blob = new Blob(mime.startsWith('text/csv') ? ['\uFEFF', text] : [text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
