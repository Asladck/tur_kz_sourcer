import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useParams } from 'react-router';
import { Layout } from './components/Layout';
import { I18nProvider, isLang, preferredLang } from './i18n/i18n';
import Dictionary from './pages/Dictionary';
import EntryPage from './pages/EntryPage';
import History from './pages/History';
import Home from './pages/Home';
import Method from './pages/Method';
import MethodLayout from './pages/MethodLayout';
import NotFound from './pages/NotFound';
import Present from './pages/Present';
import Sounds from './pages/Sounds';
import Stats from './pages/Stats';

// MapLibre is only loaded on the map page.
const MapPage = lazy(() => import('./pages/MapPage'));

/** "/" → "/kk" (or the language remembered from the last visit). */
function RootRedirect() {
  const { search, hash } = useLocation();
  return <Navigate to={`/${preferredLang()}${search}${hash}`} replace />;
}

/**
 * Every page lives under a language prefix. Paths without one (links from the
 * first version of the site: /entry/7, /stats…) are redirected to it.
 */
function LangGate() {
  const { lang } = useParams();
  const { pathname, search, hash } = useLocation();
  if (!isLang(lang)) return <Navigate to={`/${preferredLang()}${pathname}${search}${hash}`} replace />;
  return (
    <I18nProvider lang={lang}>
      <Routes>
        <Route path="present" element={<Present />} />
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route
            path="map"
            element={
              <Suspense fallback={<div className="container page-body" aria-busy="true" />}>
                <MapPage />
              </Suspense>
            }
          />
          <Route path="dictionary" element={<Dictionary />} />
          <Route path="entry/:id" element={<EntryPage />} />
          <Route path="sounds" element={<Sounds />} />
          <Route path="history" element={<History />} />
          <Route path="method" element={<MethodLayout />}>
            <Route index element={<Method />} />
            <Route path="stats" element={<Stats />} />
          </Route>
          <Route path="stats" element={<Navigate to={`/${lang}/method/stats${search}`} replace />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </I18nProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path=":lang/*" element={<LangGate />} />
      </Routes>
    </BrowserRouter>
  );
}
