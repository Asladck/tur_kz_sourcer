import { Link } from 'react-router';
import site from '../../site.config.json';
import { PairNames } from '../components/Morphemes';
import { RamHornCorner, RamHornDivider, Shanyrak } from '../components/Ornaments';
import { Icon, LINK_COLORS, LinkBadge, Txt } from '../components/ui';
import { entries, getEntry, linkCounts } from '../data/dataset';
import { LINK_TYPES } from '../data/types';
import { LANGS, useI18n, type Lang } from '../i18n/i18n';
import kk from '../i18n/kk.json';
import ru from '../i18n/ru.json';
import tr from '../i18n/tr.json';
import { usePageMeta } from '../lib/meta';

const TITLES: Record<Lang, string> = { kk: kk.site.title, tr: tr.site.title, ru: ru.site.title };

export function LinkDistribution({ compact = false }: { compact?: boolean }) {
  const { t, lp, locale } = useI18n();
  const total = entries.length;
  const pct = (n: number) => ((n / total) * 100).toLocaleString(locale, { maximumFractionDigits: 0 });
  return (
    <div className="dist">
      <div className="stack-bar" role="img" aria-label={LINK_TYPES.map((k) => `${t(`link.${k}`)}: ${linkCounts.get(k) ?? 0}`).join(', ')}>
        {LINK_TYPES.map((k) => {
          const n = linkCounts.get(k) ?? 0;
          return n ? (
            <Link
              key={k}
              to={lp(`/dictionary?type=${k}`)}
              className="stack-seg"
              style={{ flexGrow: n, background: LINK_COLORS[k] }}
              title={`${t(`link.${k}`)}: ${n} (${pct(n)}%)`}
              tabIndex={-1}
            />
          ) : null;
        })}
      </div>
      <ul className={compact ? 'dist-legend compact' : 'dist-legend'}>
        {LINK_TYPES.map((k) => {
          const n = linkCounts.get(k) ?? 0;
          return (
            <li key={k}>
              <Link to={lp(`/dictionary?type=${k}`)}>
                <LinkBadge type={k} />
              </Link>
              <span className="dist-num">{n}</span>
              <span className="dist-pct">{pct(n)}%</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function Home() {
  const { t, lp, lang } = useI18n();
  usePageMeta('', t('meta.home.description', { count: entries.length }));
  const total = entries.length;
  const verified = entries.filter((e) => e.verified).length;
  const examples = site.featuredIds.slice(0, 6).map(getEntry).filter((e) => e !== undefined);

  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-text">
            <p className="kicker">{t('site.tagline')}</p>
            <h1 className="hero-title">{t('site.title')}</h1>
            <ul className="hero-other">
              {LANGS.filter((l) => l !== lang).map((l) => (
                <li key={l} lang={l}>
                  {TITLES[l]}
                </li>
              ))}
            </ul>
            <dl className="credits">
              <div>
                <dt>{t('home.authorsLabel')}</dt>
                <dd>{t('home.authors')}</dd>
              </div>
              <div>
                <dt>{t('home.supervisorLabel')}</dt>
                <dd>{t('home.supervisor')}</dd>
              </div>
              <div>
                <dt>{t('home.institutionLabel')}</dt>
                <dd>{t('home.institution')}</dd>
              </div>
            </dl>
            <div className="cta-row">
              <Link className="btn btn-primary" to={lp('/map')}>
                <Icon name="map" />
                {t('home.ctaMap')}
              </Link>
              <Link className="btn btn-primary" to={lp('/dictionary')}>
                <Icon name="book" />
                {t('home.ctaDictionary')}
              </Link>
              <Link className="btn btn-secondary" to={lp('/method')}>
                {t('home.ctaMethod')}
              </Link>
            </div>
          </div>
          <div className="hero-emblem">
            <Shanyrak label={t('home.emblem')} />
          </div>
        </div>
      </section>

      <div className="container page-body">
        <section className="home-grid">
          <article className="card abstract">
            <RamHornCorner className="tl" />
            <h2>{t('home.abstractTitle')}</h2>
            <p>
              <Txt>{t('home.abstract', { count: total })}</Txt>
            </p>
          </article>
          <section className="card figures" aria-labelledby="figures-h">
            <RamHornCorner className="tl" />
            <h2 id="figures-h">{t('home.figuresTitle')}</h2>
            <div className="stat-tiles">
              <div className="stat-tile">
                <span className="stat-value">{total}</span>
                <span className="stat-label">{t('home.pairsLabel')}</span>
              </div>
              <div className="stat-tile">
                <span className="stat-value">{linkCounts.get('cognate') ?? 0}</span>
                <span className="stat-label">{t('home.cognateLabel')}</span>
              </div>
              <div className="stat-tile">
                <span className="stat-value">
                  {verified}
                  <small> / {total}</small>
                </span>
                <span className="stat-label">{t('home.verifiedLabel')}</span>
              </div>
            </div>
            <h3 className="h-small">{t('home.distTitle')}</h3>
            <LinkDistribution />
          </section>
        </section>

        <RamHornDivider />

        <section className="examples">
          <div className="section-head">
            <h2>{t('home.examplesTitle')}</h2>
            <Link to={lp('/dictionary')} className="more-link">
              {t('home.allEntries')}
              <Icon name="arrow-right" />
            </Link>
          </div>
          <div className="example-grid">
            {examples.map((e) => (
              <Link key={e.id} to={lp(`/entry/${e.id}`)} className="example-card">
                <span className="example-id">№ {e.id}</span>
                <PairNames entry={e} />
                <LinkBadge type={e.link} raw={e.link_type_draft} />
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
