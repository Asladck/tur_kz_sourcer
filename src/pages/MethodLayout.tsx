import { NavLink, Outlet, useLocation } from 'react-router';
import { Breadcrumbs } from '../components/Nav';
import { useI18n } from '../i18n/i18n';

/** Methodology with Statistics as a second tab (/method, /method/stats). */
export default function MethodLayout() {
  const { t, lp } = useI18n();
  const stats = useLocation().pathname.endsWith('/stats');
  return (
    <div className={`container page-body${stats ? '' : ' narrow'}`}>
      <Breadcrumbs items={stats ? [{ label: t('nav.method'), to: lp('/method') }, { label: t('nav.stats') }] : [{ label: t('nav.method') }]} />
      <header className="page-head">
        <h1>{stats ? t('stats.title') : t('method.title')}</h1>
        <p className="lead">{stats ? t('stats.lead') : t('method.lead')}</p>
      </header>
      <nav className="tabs" aria-label={t('method.title')}>
        <NavLink to={lp('/method')} end>
          {t('method.tabMethod')}
        </NavLink>
        <NavLink to={lp('/method/stats')}>{t('method.tabStats')}</NavLink>
      </nav>
      <Outlet />
    </div>
  );
}
