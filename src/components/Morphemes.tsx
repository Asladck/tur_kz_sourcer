import { Fragment } from 'react';
import type { Entry, Morph } from '../data/types';
import { useI18n } from '../i18n/i18n';
import { Icon } from './ui';

/** Leading/trailing spaces ("Tuz| Gölü") stay outside the highlight. */
function MorphText({ m, numbered }: { m: Morph; numbered: boolean }) {
  const [, lead, core, trail] = m.text.match(/^(\s*)(.*?)(\s*)$/) ?? ['', '', m.text, ''];
  return (
    <>
      {lead}
      <span className={m.pair === null ? 'morph' : `morph m-${m.mode}`}>
        {core}
        {numbered && m.pair !== null && (
          <sub className="mpair" aria-hidden="true">
            {m.pair + 1}
          </sub>
        )}
      </span>
      {trail}
    </>
  );
}

export function Name({ morphs, lang, numbered }: { morphs: Morph[]; lang: 'kk' | 'tr'; numbered: boolean }) {
  return (
    <span className="mname" lang={lang}>
      {morphs.map((m, i) => (
        <Fragment key={i}>
          {i > 0 && (
            <span className="msep" aria-hidden="true">
              |
            </span>
          )}
          <MorphText m={m} numbered={numbered} />
        </Fragment>
      ))}
    </span>
  );
}

/**
 * Small indices tie aligned components together only when position alone
 * does not: the TR name lists them in a different order (Бас|көл ↔ Göl|başı).
 */
export function isNumbered(entry: Entry): boolean {
  const order = entry.seg.tr.filter((m) => m.pair !== null).map((m) => m.pair as number);
  return order.some((p, i) => i > 0 && p < order[i - 1]);
}

/**
 * "Ақ|көл ↔ Ak|göl": KZ name in gold ink, TR name in red ink, matching
 * components highlighted in the shared turquoise. When a name has several
 * matches, small indices tie each pair together (Бас|көл ↔ Göl|başı).
 */
export function PairNames({ entry, size = 'md', legend = false }: { entry: Entry; size?: 'md' | 'lg' | 'xl'; legend?: boolean }) {
  const numbered = isNumbered(entry);
  return (
    <div className={`pair-names pair-${size}`}>
      <div className="pair-row">
        <span className="pair-side pair-kz">
          <Name morphs={entry.seg.kz} lang="kk" numbered={numbered} />
        </span>
        {/* The arrow travels with the TR name when the row wraps. */}
        <span className="pair-side pair-tr">
          <span className="pair-arrow">
            <Icon name="bridge" size={size === 'md' ? 16 : 26} />
          </span>
          <Name morphs={entry.seg.tr} lang="tr" numbered={numbered} />
        </span>
      </div>
      {legend && <MorphLegend entry={entry} />}
    </div>
  );
}

export function MorphLegend({ entry }: { entry: Entry }) {
  const { t } = useI18n();
  const all = [...entry.seg.kz, ...entry.seg.tr];
  const hasShared = all.some((m) => m.mode === 'shared');
  const hasSemantic = all.some((m) => m.mode === 'semantic');
  if (!hasShared && !hasSemantic) return null;
  return (
    <ul className="morph-legend">
      {hasShared && (
        <li>
          <span className="morph-swatch m-shared" aria-hidden="true" /> {t('entry.legendShared')}
        </li>
      )}
      {hasSemantic && (
        <li>
          <span className="morph-swatch m-semantic" aria-hidden="true" /> {t('entry.legendSemantic')}
        </li>
      )}
    </ul>
  );
}
