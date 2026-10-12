import type { ReactNode } from 'react';
import type { LinkType, ObjCat, SideKey } from '../data/types';
import { useI18n } from '../i18n/i18n';
import { useEditor } from '../lib/editor';
import { displayText } from '../lib/text';

/** Link types — validated categorical set (cognate is the shared turquoise). */
export const LINK_COLORS: Record<LinkType, string> = {
  cognate: '#0E8C9B',
  partial: '#3F63C9',
  calque: '#7B3A78',
  shared_loan: '#7C9A1E',
  doubtful: '#8A8F96',
};

/** Kazakh data is always gold, Turkish data always red. */
export const SIDE_COLORS: Record<SideKey, string> = { kz: '#C9A227', tr: '#B23A2E' };
export const INK = '#1F2A33';

/** Object type → marker shape (12×12 box), shared by badges, legend and map icons. */
export const OBJ_SHAPES: Record<ObjCat, string> = {
  oikonym: 'M6 1 A5 5 0 1 1 5.99 1 Z',
  hydronym: 'M6 0.6 C6 0.6 1.5 5.5 1.5 7.9 A4.5 4.5 0 0 0 10.5 7.9 C10.5 5.5 6 0.6 6 0.6 Z',
  oronym: 'M6 1 L11.3 10.8 H0.7 Z',
  choronym: 'M1.5 1.5 H10.5 V10.5 H1.5 Z',
  unspecified: 'M6 1.6 A4.4 4.4 0 1 1 5.99 1.6 Z',
};

/** Marker shape; filled with the side colour when `side` is given, ink otherwise. */
export function ObjShape({ cat, side, size = 12 }: { cat: ObjCat; side?: SideKey; size?: number }) {
  const color = side ? SIDE_COLORS[side] : INK;
  const hollow = cat === 'unspecified';
  return (
    <svg className="obj-shape" width={size} height={size} viewBox="0 0 12 12" aria-hidden="true" focusable="false">
      <path d={OBJ_SHAPES[cat]} fill={hollow ? 'none' : color} stroke={hollow ? color : 'none'} strokeWidth={hollow ? 1.6 : 0} />
    </svg>
  );
}

export function LinkSwatch({ type }: { type: LinkType }) {
  return <span className={`swatch swatch-${type}`} style={{ background: LINK_COLORS[type] }} aria-hidden="true" />;
}

export function LinkBadge({ type, raw, size }: { type: LinkType | null; raw?: string; size?: 'lg' }) {
  const { t } = useI18n();
  if (!type) return <span className="badge badge-unknown">{raw ?? '—'}</span>;
  return (
    <span className={`badge link-badge link-${type}${size === 'lg' ? ' badge-lg' : ''}`} title={t(`linkDesc.${type}`)}>
      <LinkSwatch type={type} />
      {t(`link.${type}`)}
    </span>
  );
}

export function ObjBadge({ cat, side }: { cat: ObjCat; side?: SideKey }) {
  const { t } = useI18n();
  return (
    <span className={`obj-badge${side ? ` obj-${side}` : ''}`} title={t(`objDesc.${cat}`)}>
      <ObjShape cat={cat} side={side} size={11} />
      {side && <span className="obj-side">{side.toUpperCase()}</span>}
      {t(`obj.${cat}`)}
    </span>
  );
}

export function VerifiedBadge({ verified }: { verified: boolean }) {
  const { t } = useI18n();
  if (verified) {
    return (
      <span className="status status-ok" title={t('common.verified')}>
        <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
          <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M4.8 8.2 7 10.3 11.3 5.8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {t('common.verified')}
      </span>
    );
  }
  return (
    <span className="status status-review" title={t('common.inReviewTitle')}>
      <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
        <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2.2 1.8" />
        <path d="M8 4.5V8l2.4 1.6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      {t('common.inReview')}
    </span>
  );
}

const ARROWS: Record<string, string> = {
  '←': 'M14 8H2.5M6.5 4 2.5 8l4 4',
  '→': 'M2 8h11.5M9.5 4l4 4-4 4',
  '↔': 'M1.5 8h13M5 4.5 1.5 8 5 11.5M11 4.5 14.5 8 11 11.5',
};

/**
 * Text as stored, with the arrows ← → ↔ drawn as inline SVG: none of the
 * bundled Noto subsets contains them, and a system fallback font must not be
 * used (see scripts/check-glyphs.mjs).
 */
export function Txt({ children }: { children: string }) {
  const parts = displayText(children).split(/([←→↔])/);
  return (
    <>
      {parts.map((p, i) =>
        ARROWS[p] ? (
          <svg key={i} className="txt-arrow" viewBox="0 0 16 16" role="img" aria-label={p}>
            <path d={ARROWS[p]} />
          </svg>
        ) : (
          p
        ),
      )}
    </>
  );
}

/** Shows a stored value as is, or the localized "no data" marker. */
export function Value({ v }: { v: unknown }) {
  const { t } = useI18n();
  const empty = v === null || v === undefined || (typeof v === 'string' && !v.trim());
  if (empty) return <span className="no-data">{t('common.noData')}</span>;
  return <Txt>{String(v)}</Txt>;
}

/** Yellow plaque shown only in editor mode. */
export function EditorNote({ label, children }: { label: string; children: ReactNode }) {
  const editor = useEditor();
  if (!editor) return null;
  return (
    <div className="editor-note">
      <span className="editor-note-label">{label}</span>
      <div>{children}</div>
    </div>
  );
}

const ICONS: Record<string, ReactNode> = {
  'arrow-left': <path d="M10 3 5 8l5 5" />,
  'arrow-right': <path d="m6 3 5 5-5 5" />,
  'arrow-up': <path d="M3 10 8 5l5 5" />,
  bridge: <path d="M1.5 8h13M5 4.5 1.5 8 5 11.5M11 4.5 14.5 8 11 11.5" />,
  print: (
    <>
      <path d="M4 6V2h8v4" />
      <rect x="2" y="6" width="12" height="6" rx="1" />
      <path d="M4.5 10h7v4h-7z" />
    </>
  ),
  copy: (
    <>
      <rect x="5" y="5" width="9" height="9" rx="1.5" />
      <path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2h-6A1.5 1.5 0 0 0 2 3.5v6A1.5 1.5 0 0 0 3.5 11H5" />
    </>
  ),
  download: <path d="M8 2v8m-3.5-3.5L8 10l3.5-3.5M3 13h10" />,
  present: (
    <>
      <rect x="1.5" y="2.5" width="13" height="8.5" rx="1" />
      <path d="M8 11v3M5.5 14h5" />
    </>
  ),
  close: <path d="m3.5 3.5 9 9m0-9-9 9" />,
  expand: <path d="M2 6V2h4M14 6V2h-4M2 10v4h4M14 10v4h-4" />,
  search: (
    <>
      <circle cx="7" cy="7" r="4.5" />
      <path d="m10.5 10.5 3.5 3.5" />
    </>
  ),
  map: <path d="M1.5 3.5 5.5 2l5 2 4-1.5v10l-4 1.5-5-2-4 1.5zM5.5 2v10M10.5 4v10" />,
  book: <path d="M2 2.5h4.5A1.5 1.5 0 0 1 8 4v10a1.5 1.5 0 0 0-1.5-1.5H2zM14 2.5H9.5A1.5 1.5 0 0 0 8 4v10a1.5 1.5 0 0 1 1.5-1.5H14z" />,
  menu: <path d="M2 4h12M2 8h12M2 12h12" />,
  pin: (
    <>
      <path d="M8 14.5s-4.5-4.2-4.5-7.5a4.5 4.5 0 0 1 9 0c0 3.3-4.5 7.5-4.5 7.5z" />
      <circle cx="8" cy="7" r="1.6" />
    </>
  ),
  filter: <path d="M2 3h12L9.5 8.5V13l-3 1.5v-6z" />,
  sort: <path d="M5 2v12M2.5 4.5 5 2l2.5 2.5M11 14V2M8.5 11.5 11 14l2.5-2.5" />,
  'sort-asc': <path d="M8 13V3M4.5 6.5 8 3l3.5 3.5" />,
  'sort-desc': <path d="M8 3v10M4.5 9.5 8 13l3.5-3.5" />,
  enter: <path d="M13 3v5a2 2 0 0 1-2 2H3m3-3-3 3 3 3" />,
  globe: (
    <>
      <circle cx="8" cy="8" r="6.3" />
      <path d="M1.7 8h12.6M8 1.7c-2 2-2.8 4-2.8 6.3s.8 4.3 2.8 6.3c2-2 2.8-4 2.8-6.3S10 3.7 8 1.7z" />
    </>
  ),
  json: <path d="M5.5 2.5C4 2.5 4 3.5 4 5s-.5 3-2 3c1.5 0 2 1.5 2 3s0 2.5 1.5 2.5M10.5 2.5c1.5 0 1.5 1 1.5 2.5s.5 3 2 3c-1.5 0-2 1.5-2 3s0 2.5-1.5 2.5" />,
};

export type IconName = keyof typeof ICONS;

export function Icon({ name, size = 16 }: { name: IconName; size?: number }) {
  return (
    <svg
      className="icon"
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {ICONS[name]}
    </svg>
  );
}
