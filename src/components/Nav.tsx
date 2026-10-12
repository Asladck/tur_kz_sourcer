import { Fragment, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { LANG_LABEL, LANG_NAME, LANGS, swapLang, useI18n } from '../i18n/i18n';
import { Icon } from './ui';

export interface Crumb {
  label: string;
  to?: string;
}

/** "Басты бет › Сөздік › Ақкөл–Akgöl" — the home link is added automatically. */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const { t, lp } = useI18n();
  const all: Crumb[] = [{ label: t('nav.home'), to: lp('/') }, ...items];
  return (
    <nav className="crumbs" aria-label={t('a11y.breadcrumb')}>
      <ol>
        {all.map((c, i) => (
          <Fragment key={i}>
            <li>
              {c.to && i < all.length - 1 ? (
                <Link to={c.to}>{c.label}</Link>
              ) : (
                <span aria-current={i === all.length - 1 ? 'page' : undefined}>{c.label}</span>
              )}
            </li>
            {i < all.length - 1 && (
              <li className="crumb-sep" aria-hidden="true">
                ›
              </li>
            )}
          </Fragment>
        ))}
      </ol>
    </nav>
  );
}

/** ҚАЗ · TÜR · РУС — keeps the current page, filters and hash. */
export function LangSwitch({ className = '' }: { className?: string }) {
  const { lang, t } = useI18n();
  const { pathname, search, hash, state } = useLocation();
  const navigate = useNavigate();
  return (
    <div className={`lang-switch ${className}`} role="group" aria-label={t('a11y.language')}>
      {LANGS.map((l) => (
        <button
          key={l}
          type="button"
          lang={l}
          aria-pressed={lang === l}
          title={LANG_NAME[l]}
          onClick={() => l !== lang && navigate(`${swapLang(pathname, l)}${search}${hash}`, { replace: true, state })}
        >
          {LANG_LABEL[l]}
        </button>
      ))}
    </div>
  );
}

export function BackToTop() {
  const { t } = useI18n();
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 700);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  if (!show) return null;
  return (
    <button
      type="button"
      className="back-to-top"
      aria-label={t('a11y.backToTop')}
      title={t('a11y.backToTop')}
      onClick={() => {
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
        document.getElementById('main')?.focus({ preventScroll: true });
      }}
    >
      <Icon name="arrow-up" size={18} />
    </button>
  );
}
