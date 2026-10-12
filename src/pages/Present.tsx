import { useCallback, useEffect, useMemo } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import site from '../../site.config.json';
import { Bridge } from '../components/Bridge';
import { LangSwitch } from '../components/Nav';
import { Shanyrak } from '../components/Ornaments';
import { Icon, ObjBadge, Txt, Value } from '../components/ui';
import { entries, getEntry } from '../data/dataset';
import type { Entry } from '../data/types';
import { useI18n } from '../i18n/i18n';
import { usePageMeta } from '../lib/meta';
import { LinkDistribution } from './Home';

function TitleSlide() {
  const { t } = useI18n();
  return (
    <div className="slide slide-title">
      <div className="slide-title-text">
        <p className="kicker">{t('site.tagline')}</p>
        <h1>{t('site.title')}</h1>
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
        <div className="slide-dist">
          <p className="slide-count">
            <strong>{entries.length}</strong> {t('home.pairsLabel')}
          </p>
          <LinkDistribution compact />
        </div>
      </div>
      <div className="slide-emblem">
        <Shanyrak label={t('home.emblem')} />
      </div>
    </div>
  );
}

function PairSlide({ entry }: { entry: Entry }) {
  const { t } = useI18n();
  return (
    <div className="slide slide-pair">
      <div className="slide-top">
        <span className="entry-id">№ {entry.id}</span>
      </div>
      <Bridge entry={entry} />
      <div className="slide-sides">
        {(['kz', 'tr'] as const).map((side) => (
          <div key={side} className={`slide-side side-${side}`}>
            <div className="slide-side-head">
              <span className="shore-country">{t(`common.${side}`)}</span>
              <ObjBadge cat={side === 'kz' ? entry.kzCat : entry.trCat} side={side} />
            </div>
            <p className="slide-loc" lang="kk">
              <Value v={entry[side].location} />
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Present() {
  const { t, lp } = useI18n();
  usePageMeta(t('meta.present.title'), t('meta.present.description'));
  const navigate = useNavigate();
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const from = (location.state as { from?: string } | null)?.from ?? lp('/');

  const slides = useMemo(() => {
    const ids = params.get('ids')?.split(',').map(Number).filter(Boolean) ?? site.featuredIds;
    return [null, ...ids.map(getEntry).filter((e): e is Entry => e !== undefined)];
  }, [params]);

  const index = Math.min(Math.max(Number(params.get('s')) || 0, 0), slides.length - 1);

  const go = useCallback(
    (i: number) => {
      const p = new URLSearchParams(params);
      p.set('s', String(Math.min(Math.max(i, 0), slides.length - 1)));
      setParams(p, { replace: true, state: location.state });
    },
    [params, setParams, slides.length, location.state],
  );

  const exit = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen();
    // A language switch inside the presentation must carry over to the page we return to.
    navigate(from.replace(/^\/(kk|tr|ru)(?=\/|$)/, lp('/')));
  }, [navigate, from, lp]);

  const fullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen?.();
  };

  useEffect(() => {
    document.documentElement.classList.add('presenting');
    return () => document.documentElement.classList.remove('presenting');
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      const target = e.target as HTMLElement;
      if (target.closest('input, select, textarea')) return;
      if (['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Enter'].includes(e.key)) {
        if (e.key === 'Enter' && target.closest('button, a')) return;
        e.preventDefault();
        go(index + 1);
      } else if (['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'].includes(e.key)) {
        e.preventDefault();
        go(index - 1);
      } else if (e.key === 'Home') go(0);
      else if (e.key === 'End') go(slides.length - 1);
      else if (e.key === 'Escape' && !document.fullscreenElement) exit();
      else if (['f', 'F', 'а', 'А'].includes(e.key)) fullscreen();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, index, slides.length, exit]);

  const current = slides[index];

  return (
    <div className="present">
      <div className="present-bar">
        <span className="present-brand">{t('site.title')}</span>
        <div className="present-tools">
          <LangSwitch />
          <button type="button" className="btn btn-small btn-ghost" onClick={fullscreen}>
            <Icon name="expand" />
            <span>{t('present.fullscreen')}</span>
          </button>
          <button type="button" className="btn btn-small btn-ghost" onClick={exit}>
            <Icon name="close" />
            <span>{t('present.exit')}</span>
          </button>
        </div>
      </div>
      <main className="present-stage" aria-live="polite" aria-label={t('present.slide', { n: index + 1, total: slides.length })}>
        {current ? <PairSlide key={current.id} entry={current} /> : <TitleSlide />}
      </main>
      <button type="button" className="present-nav prev" onClick={() => go(index - 1)} disabled={index === 0} aria-label={t('common.prev')}>
        <Icon name="arrow-left" />
      </button>
      <button type="button" className="present-nav next" onClick={() => go(index + 1)} disabled={index === slides.length - 1} aria-label={t('common.next')}>
        <Icon name="arrow-right" />
      </button>
      <footer className="present-foot">
        <div className="present-progress" aria-hidden="true">
          <div style={{ width: `${((index + 1) / slides.length) * 100}%` }} />
        </div>
        <div className="present-foot-row">
          <span>
            <Txt>{t('present.hint')}</Txt>
          </span>
          <span>{t('present.slide', { n: index + 1, total: slides.length })}</span>
        </div>
      </footer>
    </div>
  );
}
