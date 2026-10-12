import { Link } from 'react-router';
import { RamHornDivider } from '../components/Ornaments';
import { LinkBadge, ObjBadge, Txt } from '../components/ui';
import { allSources, entries, linkCounts, meta, referenceMarkers, sourceToText } from '../data/dataset';
import { LINK_TYPES, OBJ_CATS } from '../data/types';
import { useI18n } from '../i18n/i18n';
import { usePageMeta } from '../lib/meta';

const PARAMS: [string, string][] = [
  ['kz.name / tr.name', 'name'],
  ['kz.type / tr.type', 'type'],
  ['kz.location / tr.location', 'location'],
  ['kz.structure / tr.structure', 'structure'],
  ['kz.etymology / tr.etymology', 'etymology'],
  ['kz.etymology_ru / tr.etymology_ru', 'etymologyRu'],
  ['kz.lat, kz.lon / tr.lat, tr.lon', 'coords'],
  ['tr.name_in_source', 'nameInSource'],
  ['link_type_draft', 'linkType'],
  ['review_notes', 'reviewNotes'],
  ['verified', 'verified'],
  ['sources', 'sources'],
];

export default function Method() {
  const { t, get, lp } = useI18n();
  usePageMeta(t('meta.method.title'), t('meta.method.description'));
  const verify = get<string[]>('method.verify') ?? [];
  const markers = referenceMarkers();
  const sources = allSources();
  const verified = entries.filter((e) => e.verified).length;

  return (
    <div className="method">
      <nav className="toc" aria-label={t('method.title')}>
        <ol>
          <li><a href="#params">{t('method.paramsTitle')}</a></li>
          <li><a href="#links">{t('method.linkTitle')}</a></li>
          <li><a href="#objects">{t('method.objTitle')}</a></li>
          <li><a href="#morph">{t('method.morphTitle')}</a></li>
          <li><a href="#verify">{t('method.verifyTitle')}</a></li>
          <li><a href="#corpus">{t('method.corpusTitle')}</a></li>
          <li><a href="#sources">{t('method.sourcesTitle')}</a></li>
        </ol>
      </nav>

      <RamHornDivider />

      <section id="params">
        <h2>{t('method.paramsTitle')}</h2>
        <div className="table-wrap">
          <table className="data-table compact">
            <thead>
              <tr>
                <th scope="col">{t('method.paramsField')}</th>
                <th scope="col">{t('method.paramsDesc')}</th>
              </tr>
            </thead>
            <tbody>
              {PARAMS.map(([field, key]) => (
                <tr key={key}>
                  <th scope="row"><code>{field}</code></th>
                  <td>{t(`method.params.${key}`)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section id="links">
        <h2>{t('method.linkTitle')}</h2>
        <dl className="def-list">
          {LINK_TYPES.map((k) => (
            <div key={k} className="def-item">
              <dt>
                <LinkBadge type={k} />
                <Link to={lp(`/dictionary?type=${k}`)} className="def-count">{t('common.pairsN', { n: linkCounts.get(k) ?? 0 })}</Link>
              </dt>
              <dd>
                <p>{t(`linkDesc.${k}`)}</p>
                {meta.link_types[k] && (
                  <p className="source-def" lang="kk">
                    <span className="muted">{t('method.linkSourceDef')}:</span> «{meta.link_types[k]}»
                  </p>
                )}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section id="objects">
        <h2>{t('method.objTitle')}</h2>
        <ul className="obj-list">
          {OBJ_CATS.map((c) => (
            <li key={c}>
              <ObjBadge cat={c} /> — {t(`objDesc.${c}`)}
            </li>
          ))}
        </ul>
        <p className={t('method.objNote').startsWith('[') ? 'placeholder' : 'muted'}>{t('method.objNote')}</p>
      </section>

      <section id="morph">
        <h2>{t('method.morphTitle')}</h2>
        <p className={t('method.morphText').startsWith('[') ? 'placeholder' : undefined}>
          <Txt>{t('method.morphText')}</Txt>
        </p>
      </section>

      <section id="verify">
        <h2>{t('method.verifyTitle')}</h2>
        <p>{t('method.verifyLead')}</p>
        <ol className="criteria">
          {verify.map((v, i) => (
            <li key={i}>{v}</li>
          ))}
        </ol>
        <p className="muted">{t('method.verifyStatus', { n: verified, total: entries.length })}</p>
      </section>

      <section id="corpus">
        <h2>{t('method.corpusTitle')}</h2>
        <dl className="kv">
          <div>
            <dt>{t('method.corpusName')}</dt>
            <dd lang="kk">{meta.title}</dd>
          </div>
          <div>
            <dt>{t('method.corpusEntries')}</dt>
            <dd>{meta.entries}</dd>
          </div>
          <div>
            <dt>{t('method.corpusGaps')}</dt>
            <dd>{meta.source_numbering_gaps?.length ? meta.source_numbering_gaps.join(', ') : t('common.noData')}</dd>
          </div>
          <div>
            <dt>{t('method.corpusNote')}</dt>
            <dd lang="kk">{meta.note || t('common.noData')}</dd>
          </div>
        </dl>
      </section>

      <section id="sources">
        <h2>{t('method.sourcesTitle')}</h2>
        <h3 className="h-small">{t('method.sourcesFromMeta')}</h3>
        {sources.length ? (
          <ol className="sources-list">
            {sources.map((s, i) => (
              <li key={i}>
                {sourceToText(s.value)}
                {s.ids.length > 0 && (
                  <span className="muted">
                    {' '}— {s.ids.map((id, j) => (
                      <span key={id}>
                        {j > 0 && ', '}
                        <Link to={lp(`/entry/${id}`)}>№{id}</Link>
                      </span>
                    ))}
                  </span>
                )}
              </li>
            ))}
          </ol>
        ) : (
          <p className="no-data">{t('method.sourcesNone')}</p>
        )}

        {markers.length > 0 && (
          <>
            <h3 className="h-small">{t('method.markersTitle')}</h3>
            <p className="muted">{t('method.markersLead')}</p>
            <div className="table-wrap">
              <table className="data-table compact">
                <thead>
                  <tr>
                    <th scope="col">{t('method.markerCol')}</th>
                    <th scope="col">{t('method.markerWhere')}</th>
                  </tr>
                </thead>
                <tbody>
                  {markers.map(([n, refs]) => (
                    <tr key={n}>
                      <th scope="row">[{n}]</th>
                      <td>
                        {refs.map((r, i) => (
                          <span key={i}>
                            {i > 0 && '; '}
                            <Link to={lp(`/entry/${r.id}`)}>№{r.id}</Link> <code>{r.side}.{r.field}</code>
                          </span>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <h3 className="h-small">{t('method.bibTitle')}</h3>
        <p className="placeholder-block">{t('method.bibPlaceholder')}</p>
      </section>
    </div>
  );
}
