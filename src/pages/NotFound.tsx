import { Link } from 'react-router';
import { useI18n } from '../i18n/i18n';
import { usePageMeta } from '../lib/meta';

export default function NotFound({ message }: { message?: string }) {
  const { t, lp } = useI18n();
  usePageMeta(t('meta.notFound.title'), t('notFound.text'));
  return (
    <div className="container page-body narrow">
      <h1>{t('notFound.title')}</h1>
      <p className="lead">{message ?? t('notFound.text')}</p>
      <Link to={lp('/')} className="btn btn-primary">
        {t('notFound.home')}
      </Link>
    </div>
  );
}
