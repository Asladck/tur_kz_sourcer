import { useRef, useState, type ReactNode } from 'react';
import { useI18n } from '../i18n/i18n';

export interface BarSeries {
  key: string;
  label: string;
  color: string;
}

export interface BarRow {
  key: string;
  label: ReactNode;
  /** Plain-text label for tooltips and the table view. */
  text: string;
  values: Record<string, number>;
  /** Per-row colour (single-series charts whose categories have a site-wide colour). */
  color?: string;
}

interface Props {
  title: string;
  rows: BarRow[];
  series: BarSeries[];
  /** Denominator for percentages in the tooltip / table. */
  total?: number;
  note?: string;
}

/**
 * Horizontal bar chart in plain HTML: thin bars, value labels at the bar end,
 * per-row hover/focus tooltip and a table view.
 */
export function BarChart({ title, rows, series, total, note }: Props) {
  const { t, locale } = useI18n();
  const [table, setTable] = useState(false);
  const [hover, setHover] = useState<{ row: BarRow; x: number; y: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const max = Math.max(1, ...rows.flatMap((r) => series.map((s) => r.values[s.key] ?? 0)));
  const pct = (v: number) => (total ? ` · ${((v / total) * 100).toLocaleString(locale, { maximumFractionDigits: 1 })}%` : '');

  const show = (row: BarRow, el: HTMLElement, clientX?: number) => {
    const box = ref.current?.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    if (!box) return;
    setHover({ row, x: (clientX ?? r.left + r.width / 2) - box.left, y: r.top - box.top });
  };

  return (
    <figure className="chart">
      <div className="chart-head">
        <figcaption className="chart-title">{title}</figcaption>
        <button type="button" className="btn btn-small btn-ghost" onClick={() => setTable((v) => !v)} aria-pressed={table}>
          {table ? t('common.showChart') : t('common.showTable')}
        </button>
      </div>
      {series.length > 1 && (
        <ul className="chart-legend">
          {series.map((s) => (
            <li key={s.key}>
              <span className="swatch" style={{ background: s.color }} aria-hidden="true" />
              {s.label}
            </li>
          ))}
        </ul>
      )}
      {table ? (
        <div className="table-wrap">
          <table className="data-table compact">
            <thead>
              <tr>
                <th scope="col" />
                {series.map((s) => (
                  <th key={s.key} scope="col" className="num">{series.length > 1 ? s.label : t('common.count')}</th>
                ))}
                {total && series.length === 1 && <th scope="col" className="num">{t('common.share')}</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.key}>
                  <th scope="row">{r.label}</th>
                  {series.map((s) => (
                    <td key={s.key} className="num">{r.values[s.key] ?? 0}</td>
                  ))}
                  {total && series.length === 1 && (
                    <td className="num">{(((r.values[series[0].key] ?? 0) / total) * 100).toLocaleString(locale, { maximumFractionDigits: 1 })}%</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bars" ref={ref} onMouseLeave={() => setHover(null)}>
          {rows.map((r) => (
            <div
              key={r.key}
              className={`bar-row${series.length > 1 ? ' grouped' : ''}`}
              tabIndex={0}
              onMouseMove={(e) => show(r, e.currentTarget, e.clientX)}
              onFocus={(e) => show(r, e.currentTarget)}
              onBlur={() => setHover(null)}
            >
              <div className="bar-label">{r.label}</div>
              <div className="bar-tracks">
                {series.map((s) => {
                  const v = r.values[s.key] ?? 0;
                  return (
                    <div className="bar-track" key={s.key}>
                      <div className="bar" style={{ width: `${(v / max) * 100}%`, background: r.color ?? s.color }} />
                      <span className="bar-value">{v}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          {hover && (
            <div className="chart-tooltip" style={{ left: hover.x, top: hover.y }} role="tooltip">
              <strong>{hover.row.text}</strong>
              {series.map((s) => (
                <div key={s.key} className="tt-row">
                  <span className="swatch" style={{ background: hover.row.color ?? s.color }} aria-hidden="true" />
                  {series.length > 1 && <span>{s.label}:</span>}
                  <span className="tt-val">
                    {hover.row.values[s.key] ?? 0}
                    {pct(hover.row.values[s.key] ?? 0)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {note && <p className="chart-note">{note}</p>}
    </figure>
  );
}
