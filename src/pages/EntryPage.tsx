import { useState } from 'react';
import { Link, useParams } from 'react-router';
import site from '../../site.config.json';
import { Bridge } from '../components/Bridge';
import { PairNames } from '../components/Morphemes';
import { Breadcrumbs } from '../components/Nav';
import { RamHornCorner, SeljukStar } from '../components/Ornaments';
import { EditorNote, Icon, ObjBadge, Txt, Value, VerifiedBadge } from '../components/ui';
import { componentLabel, entries, getEntry, hasCoords, neighbours, similarEntries, sourceToText } from '../data/dataset';
import type { Entry, RawSide, SideKey } from '../data/types';
import { useI18n } from '../i18n/i18n';
import { absoluteUrl, usePageMeta } from '../lib/meta';
import { fold } from '../lib/text';
import NotFound from './NotFound';

/** Russian interface: etymology_ru when present, otherwise the Kazakh text marked as pending. */
function Etymology({ s }: { s: RawSide }) {
  const { lang, t } = useI18n();
  if (lang === 'ru' && s.etymology_ru?.trim()) {
    return (
      <span lang="ru">
        <Txt>{s.etymology_ru}</Txt>
      </span>
    );
  }
  if (lang === 'ru' && s.etymology?.trim()) {
    return (
      <>
        <span className="pending-tag">{t('common.translationPending')}</span>
        <span lang="kk">
          <Txt>{s.etymology}</Txt>
        </span>
      </>
    );
  }
  return <Value v={s.etymology} />;
}

function Shore({ entry, side }: { entry: Entry; side: SideKey }) {
  const { t } = useI18n();
  const s = entry[side];
  const cat = side === 'kz' ? entry.kzCat : entry.trCat;
  return (
    <section className={`shore shore-${side}`} aria-label={t(`common.${side}`)}>
      {side === 'kz' && <RamHornCorner className="tl" />}
      {side === 'kz' && <RamHornCorner className="br" />}
      <header className="shore-head">
        {side === 'tr' && <SeljukStar size={30} className="shore-star" />}
        <span className="shore-country">{t(`common.${side}`)}</span>
        <h2 className="shore-name" lang={side === 'kz' ? 'kk' : 'tr'}>
          {s.name}
        </h2>
      </header>
      <dl className="fields">
        <div>
          <dt>{t('field.type')}</dt>
          <dd>
            <ObjBadge cat={cat} side={side} />
            {/* The stored value is shown as is unless it just repeats the category label. */}
            {fold(s.type ?? '') !== fold(t(`obj.${cat}`)) && (
              <span className="raw-type" lang="kk">
                <Value v={s.type} />
              </span>
            )}
          </dd>
        </div>
        <div>
          <dt>{t('field.location')}</dt>
          <dd lang="kk">
            <Value v={s.location} />
          </dd>
        </div>
        <div>
          <dt>{t('field.structure')}</dt>
          <dd lang="kk">
            <Value v={s.structure} />
          </dd>
        </div>
        <div>
          <dt>{t('field.etymology')}</dt>
          <dd className="etymology" lang="kk">
            <Etymology s={s} />
          </dd>
        </div>
        <div>
          <dt>{t('field.coords')}</dt>
          <dd>{hasCoords(s) ? <span className="coords">{s.lat!.toFixed(4)}, {s.lon!.toFixed(4)}</span> : <Value v={null} />}</dd>
        </div>
      </dl>
      {side === 'tr' && s.name_in_source && <EditorNote label={t('field.nameInSource')}>{s.name_in_source}</EditorNote>}
    </section>
  );
}

function Citation({ entry }: { entry: Entry }) {
  const { t, lp } = useI18n();
  const [copied, setCopied] = useState(false);
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const date = `${pad(now.getDate())}.${pad(now.getMonth() + 1)}.${now.getFullYear()}`;
  const text = t('entry.citeTemplate', {
    authors: t('entry.citeAuthors'),
    kz: entry.kz.name,
    tr: entry.tr.name,
    id: entry.id,
    year: site.citationYear,
    url: absoluteUrl(lp(`/entry/${entry.id}`)),
    date,
  });
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked: the text stays selectable */
    }
  };
  return (
    <section className="card cite-box">
      <div className="cite-head">
        <h2 className="h-small">{t('entry.cite')}</h2>
        <span className="muted small">{t('entry.citeStyle')}</span>
      </div>
      <p className="cite-text">{text}</p>
      <button type="button" className="btn btn-small btn-secondary no-print" onClick={copy}>
        <Icon name="copy" />
        <span aria-live="polite">{copied ? t('common.copied') : t('common.copy')}</span>
      </button>
    </section>
  );
}

export default function EntryPage() {
  const { t, lp } = useI18n();
  const { id } = useParams();
  const entry = getEntry(Number(id));
  usePageMeta(
    entry ? t('meta.entry.title', { kz: entry.kz.name, tr: entry.tr.name, id: entry.id }) : t('meta.notFound.title'),
    entry
      ? t('meta.entry.description', {
          id: entry.id,
          kz: entry.kz.name,
          tr: entry.tr.name,
          kzCountry: t('common.kz'),
          trCountry: t('common.tr'),
          link: entry.link ? t(`link.${entry.link}`) : entry.link_type_draft,
        })
      : '',
  );

  if (!entry) return <NotFound message={t('entry.notFound', { id: id ?? '' })} />;
  const { prev, next, index } = neighbours(entry.id);
  const similar = similarEntries(entry, 4);

  return (
    <div className="container page-body entry-page" data-print-url={absoluteUrl(lp(`/entry/${entry.id}`))}>
      <Breadcrumbs items={[{ label: t('nav.dictionary'), to: lp('/dictionary') }, { label: `${entry.kz.name}–${entry.tr.name}` }]} />

      <div className="entry-bar">
        <span className="entry-id">№ {entry.id}</span>
        <span className="muted small">{t('entry.position', { n: index + 1, total: entries.length })}</span>
        <VerifiedBadge verified={entry.verified} />
        <div className="entry-actions no-print">
          <Link className="btn btn-small btn-secondary" to={lp(`/map?focus=${entry.id}`)}>
            <Icon name="pin" />
            {t('common.showOnMap')}
          </Link>
          <button type="button" className="btn btn-small btn-ghost" onClick={() => window.print()}>
            <Icon name="print" />
            {t('common.print')}
          </button>
        </div>
      </div>

      <Bridge entry={entry} />

      <EditorNote label={t('field.linkTypeDraft')}>
        <code>{entry.link_type_draft}</code> — {t('editor.draftHint')}
      </EditorNote>
      {entry.review_notes && <EditorNote label={t('field.reviewNotes')}>{entry.review_notes}</EditorNote>}
      <EditorNote label={t('entry.morph')}>{t('editor.segHint')}</EditorNote>

      <div className="shores">
        <Shore entry={entry} side="kz" />
        <Shore entry={entry} side="tr" />
      </div>

      <section className="card sources-box">
        <h2 className="h-small">{t('field.sources')}</h2>
        {entry.sources.length ? (
          <ol>
            {entry.sources.map((s, i) => (
              <li key={i}>{sourceToText(s)}</li>
            ))}
          </ol>
        ) : (
          <p className="no-data">{t('common.noData')}</p>
        )}
      </section>

      {similar.length > 0 && (
        <section className="similar no-print" aria-labelledby="similar-h">
          <h2 id="similar-h" className="h-section">
            {t('entry.similar')}
          </h2>
          <div className="similar-grid">
            {similar.map(({ entry: o, keys }) => (
              <Link key={o.id} to={lp(`/entry/${o.id}`)} className="example-card">
                <span className="example-id">№ {o.id}</span>
                <PairNames entry={o} />
                <span className="similar-by">{t('entry.similarBy', { c: keys.map(componentLabel).join(', ') })}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <Citation entry={entry} />

      <nav className="pager no-print" aria-label={`${t('common.prev')} / ${t('common.next')}`}>
        {prev ? (
          <Link to={lp(`/entry/${prev.id}`)} className="pager-link" rel="prev">
            <Icon name="arrow-left" />
            <span>
              <small>
                {t('common.prev')} · № {prev.id}
              </small>
              {prev.kz.name} — {prev.tr.name}
            </span>
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link to={lp(`/entry/${next.id}`)} className="pager-link pager-next" rel="next">
            <span>
              <small>
                {t('common.next')} · № {next.id}
              </small>
              {next.kz.name} — {next.tr.name}
            </span>
            <Icon name="arrow-right" />
          </Link>
        )}
      </nav>
    </div>
  );
}
