import { Breadcrumbs } from '../components/Nav';
import { RamHornCorner, SeljukStar } from '../components/Ornaments';
import { useI18n } from '../i18n/i18n';
import { usePageMeta } from '../lib/meta';

type Branch = 'common' | 'oghuz' | 'kipchak' | 'both';

/** Order and branch of the timeline items; texts live in the locale files (history.items). */
const ITEMS: { id: string; branch: Branch }[] = [
  { id: 'common', branch: 'common' },
  { id: 'yabgu', branch: 'oghuz' },
  { id: 'seljuk', branch: 'oghuz' },
  { id: 'anatolia', branch: 'oghuz' },
  { id: 'kipchak', branch: 'kipchak' },
  { id: 'modern', branch: 'both' },
];

const BRANCH_LABEL: Record<Branch, string> = {
  common: 'history.branchCommon',
  oghuz: 'history.branchOghuz',
  kipchak: 'history.branchKipchak',
  both: 'history.branchBoth',
};

export default function History() {
  const { t } = useI18n();
  usePageMeta(t('meta.history.title'), t('meta.history.description'));
  return (
    <div className="container page-body narrow">
      <Breadcrumbs items={[{ label: t('history.title') }]} />
      <header className="page-head">
        <h1>{t('history.title')}</h1>
        <p className="lead">{t('history.lead')}</p>
      </header>
      <ul className="branch-legend">
        {(['common', 'oghuz', 'kipchak', 'both'] as Branch[]).map((b) => (
          <li key={b}>
            <span className={`branch-dot b-${b}`} aria-hidden="true" />
            {t(BRANCH_LABEL[b])}
          </li>
        ))}
      </ul>
      <ol className="timeline">
        {ITEMS.map(({ id, branch }) => {
          const date = t(`history.items.${id}.date`);
          const text = t(`history.items.${id}.text`);
          return (
            <li key={id} className={`tl-item b-${branch}`}>
              <span className="tl-dot" aria-hidden="true" />
              <div className="tl-card">
                {branch === 'kipchak' && <RamHornCorner className="tl" />}
                {branch === 'oghuz' && <SeljukStar size={22} className="tl-star" />}
                <div className="tl-meta">
                  {date && <span className="tl-date">{date}</span>}
                  <span className="tl-branch">{t(BRANCH_LABEL[branch])}</span>
                </div>
                <h2 className="tl-title">{t(`history.items.${id}.title`)}</h2>
                <p className={text.startsWith('[') ? 'tl-text placeholder' : 'tl-text'}>{text}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
