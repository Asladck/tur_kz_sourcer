import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router';
import { entries } from '../data/dataset';
import { useI18n } from '../i18n/i18n';
import { useEditor } from '../lib/editor';
import { BackToTop, LangSwitch } from './Nav';
import { BrandMark, IznikBand, SeljukStar } from './Ornaments';
import { SearchDialog } from './SearchDialog';
import { Icon, type IconName } from './ui';

/** The five main sections; Statistics lives inside Methodology as a tab. */
const NAV = [
  ['/map', 'map'],
  ['/dictionary', 'dictionary'],
  ['/sounds', 'sounds'],
  ['/history', 'history'],
  ['/method', 'method'],
] as const;

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

function EditorBanner() {
  const { t } = useI18n();
  const { pathname } = useLocation();
  return (
    <div className="editor-banner" role="status">
      <span>{t('editor.banner')}</span>
      <Link to={`${pathname}?editor=0`}>{t('editor.exit')}</Link>
    </div>
  );
}

/** Full menu for small screens (opened from the bottom tab bar). */
function MenuSheet({ open, onClose, onPresent }: { open: boolean; onClose: () => void; onPresent: () => void }) {
  const { t, lp } = useI18n();
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    else if (!open && d.open) d.close();
  }, [open]);
  const items: (readonly [string, string])[] = [['/', 'home'], ...NAV, ['/method/stats', 'stats']];
  return (
    <dialog ref={ref} className="menu-sheet" aria-label={t('nav.menu')} onClose={onClose} onClick={(e) => e.target === ref.current && onClose()}>
      <div className="sheet-body">
        <div className="sheet-head">
          <span className="sheet-title">{t('nav.menu')}</span>
          <button type="button" className="icon-btn" onClick={onClose} aria-label={t('a11y.close')}>
            <Icon name="close" />
          </button>
        </div>
        <nav aria-label={t('a11y.mainNav')}>
          <ul className="sheet-nav">
            {items.map(([to, key]) => (
              <li key={key}>
                <NavLink to={lp(to)} end={to === '/' || to === '/method'} onClick={onClose}>
                  {t(`nav.${key}`)}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="sheet-tools">
          <LangSwitch />
          <button type="button" className="btn btn-secondary" onClick={onPresent}>
            <Icon name="present" />
            {t('nav.present')}
          </button>
        </div>
      </div>
    </dialog>
  );
}

function MobileTabBar({ onSearch, onMenu }: { onSearch: () => void; onMenu: () => void }) {
  const { t, lp } = useI18n();
  const tab = (icon: IconName, label: string) => (
    <>
      <Icon name={icon} size={20} />
      <span>{label}</span>
    </>
  );
  return (
    <nav className="tabbar" aria-label={t('a11y.mobileNav')}>
      <NavLink to={lp('/map')}>{tab('map', t('nav.map'))}</NavLink>
      <NavLink to={lp('/dictionary')}>{tab('book', t('nav.dictionary'))}</NavLink>
      <button type="button" onClick={onSearch}>
        {tab('search', t('nav.search'))}
      </button>
      <button type="button" onClick={onMenu}>
        {tab('menu', t('nav.menu'))}
      </button>
    </nav>
  );
}

export function Layout() {
  const { t, lp } = useI18n();
  const editor = useEditor();
  const { pathname, hash } = useLocation();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!hash) window.scrollTo(0, 0);
  }, [pathname, hash]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement).closest('input, textarea, select, [contenteditable]');
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((o) => !o);
      } else if (e.key === '/' && !typing) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const present = useCallback(() => {
    setMenuOpen(false);
    navigate(lp('/present'), { state: { from: pathname } });
  }, [navigate, lp, pathname]);

  const isEntry = pathname.includes('/entry/');

  return (
    <div className="app">
      <a className="skip-link" href="#main">
        {t('a11y.skip')}
      </a>
      {editor && <EditorBanner />}
      <header className="site-header">
        <div className="container header-inner">
          <Link to={lp('/')} className="brand" aria-label={`${t('site.title')} — ${t('nav.home')}`}>
            <BrandMark />
            <span className="brand-text">
              <span className="brand-title">{t('site.title')}</span>
              <span className="brand-sub">{t('site.tagline')}</span>
            </span>
          </Link>
          <nav className="main-nav" aria-label={t('a11y.mainNav')}>
            {NAV.map(([to, key]) => (
              <NavLink
                key={to}
                to={lp(to)}
                className={({ isActive }) => (isActive || (key === 'dictionary' && isEntry) ? 'active' : undefined)}
              >
                {t(`nav.${key}`)}
              </NavLink>
            ))}
          </nav>
          <div className="header-tools">
            <button type="button" className="search-trigger" onClick={() => setSearchOpen(true)} aria-keyshortcuts="Control+K Meta+K">
              <Icon name="search" />
              <span className="st-label">{t('nav.search')}</span>
              <kbd className="st-kbd">{isMac ? 'Cmd' : 'Ctrl'} K</kbd>
            </button>
            <LangSwitch className="header-lang" />
            <button type="button" className="icon-btn header-present" onClick={present} title={t('nav.present')} aria-label={t('nav.present')}>
              <Icon name="present" size={18} />
            </button>
          </div>
        </div>
      </header>

      <main id="main" className="site-main" tabIndex={-1}>
        <Outlet />
      </main>

      <footer className="site-footer">
        <IznikBand className="footer-band" />
        <div className="container footer-inner">
          <SeljukStar size={34} className="footer-star" />
          <div>
            <p className="footer-title">{t('site.title')}</p>
            <p>{t('footer.data', { count: entries.length })}</p>
            <p>
              © {new Date().getFullYear()} {t('footer.rights')}
            </p>
          </div>
        </div>
      </footer>

      <BackToTop />
      <MobileTabBar onSearch={() => setSearchOpen(true)} onMenu={() => setMenuOpen(true)} />
      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
      <MenuSheet open={menuOpen} onClose={() => setMenuOpen(false)} onPresent={present} />
    </div>
  );
}
