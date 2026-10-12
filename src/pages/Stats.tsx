import { Link } from 'react-router';
import { BarChart, type BarRow } from '../components/BarChart';
import { LINK_COLORS, LinkBadge, ObjBadge, SIDE_COLORS } from '../components/ui';
import { componentFrequency, componentLabel, countBy, entries, hasCoords, linkCounts } from '../data/dataset';
import { LINK_TYPES, OBJ_CATS } from '../data/types';
import { useI18n } from '../i18n/i18n';
import { useEditor } from '../lib/editor';
import { usePageMeta } from '../lib/meta';

function Meter({ label, n, total }: { label: string; n: number; total: number }) {
  const { t, locale } = useI18n();
  const share = total ? n / total : 0;
  return (
    <div className="meter">
      <div className="meter-head">
        <span>{label}</span>
        <span className="meter-val">
          {t('stats.of', { n, total })} · {(share * 100).toLocaleString(locale, { maximumFractionDigits: 1 })}%
        </span>
      </div>
      <div className="meter-track" role="meter" aria-valuemin={0} aria-valuemax={total} aria-valuenow={n} aria-label={label}>
        <div className="meter-fill" style={{ width: `${share * 100}%` }} />
      </div>
    </div>
  );
}

export default function Stats() {
  const { t, lp } = useI18n();
  const editor = useEditor();
  usePageMeta(t('meta.stats.title'), t('meta.stats.description'));
  const total = entries.length;

  const linkRows: BarRow[] = LINK_TYPES.map((k) => ({
    key: k,
    label: <LinkBadge type={k} />,
    text: t(`link.${k}`),
    values: { n: linkCounts.get(k) ?? 0 },
    color: LINK_COLORS[k],
  }));

  const kzObj = countBy(entries.map((e) => e.kzCat));
  const trObj = countBy(entries.map((e) => e.trCat));
  const objRows: BarRow[] = OBJ_CATS.map((c) => ({
    key: c,
    label: <ObjBadge cat={c} />,
    text: t(`obj.${c}`),
    values: { kz: kzObj.get(c) ?? 0, tr: trObj.get(c) ?? 0 },
  }));

  const compRows: BarRow[] = componentFrequency()
    .slice(0, 15)
    .map((r) => ({
      key: r.key,
      label: r.key.includes(':') ? (
        <span className="comp-label">{componentLabel(r.key)}</span>
      ) : (
        <Link className="comp-label" to={lp(`/dictionary?comp=${r.key}`)}>
          {componentLabel(r.key)}
        </Link>
      ),
      text: componentLabel(r.key),
      values: { kz: r.kz, tr: r.tr },
    }));

  // Kazakh series in steppe gold, Turkish in Anatolian red — as everywhere on the site.
  const sides = [
    { key: 'kz', label: t('common.kz'), color: SIDE_COLORS.kz },
    { key: 'tr', label: t('common.tr'), color: SIDE_COLORS.tr },
  ];

  const verified = entries.filter((e) => e.verified).length;
  const withCoords = entries.filter((e) => hasCoords(e.kz) && hasCoords(e.tr)).length;
  const withSources = entries.filter((e) => e.sources.length > 0).length;
  const withNotes = entries.filter((e) => e.review_notes).length;

  return (
    <div className="stats-grid">
      <BarChart title={t('stats.byLink')} rows={linkRows} series={[{ key: 'n', label: t('common.count'), color: LINK_COLORS.cognate }]} total={total} />
      <BarChart title={t('stats.byObj')} rows={objRows} series={sides} total={total} note={t('stats.byObjNote')} />
      <BarChart title={t('stats.components')} rows={compRows} series={sides} total={total} note={t('stats.componentsNote')} />
      <section className="chart completeness">
        <h2 className="chart-title">{t('stats.completeness')}</h2>
        <div className="verified-hero">
          <span className="stat-value">
            {verified}
            <small> / {total}</small>
          </span>
          <span className="stat-label">{t('stats.verifiedShare')}</span>
        </div>
        <Meter label={t('stats.verified')} n={verified} total={total} />
        <Meter label={t('stats.withCoords')} n={withCoords} total={total} />
        <Meter label={t('stats.withSources')} n={withSources} total={total} />
        {editor && (
          <div className="editor-note">
            <span className="editor-note-label">{t('editor.reviewCount')}</span>
            <div>{t('stats.of', { n: withNotes, total })}</div>
          </div>
        )}
      </section>
    </div>
  );
}
