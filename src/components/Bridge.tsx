import type { Entry } from '../data/types';
import { useI18n } from '../i18n/i18n';
import { isNumbered, MorphLegend, Name } from './Morphemes';
import { LinkBadge } from './ui';

/**
 * The turquoise "bridge" between the two shores: KZ name (gold) on the left,
 * TR name (red) on the right, an arch with the link-type badge between them.
 */
export function Bridge({ entry, legend = true }: { entry: Entry; legend?: boolean }) {
  const { t } = useI18n();
  const numbered = isNumbered(entry);
  return (
    <section className="bridge" aria-label={t('entry.bridge')}>
      <div className="bridge-row">
        <div className="pier pier-kz">
          <span className="pier-country">{t('common.kz')}</span>
          <span className="pier-name">
            <Name morphs={entry.seg.kz} lang="kk" numbered={numbered} />
          </span>
        </div>
        <div className="bridge-span">
          <svg className="bridge-arch" viewBox="0 0 200 44" preserveAspectRatio="none" aria-hidden="true" focusable="false">
            <path d="M2 42 Q100 -14 198 42" />
            <path className="bridge-deck" d="M2 42 H198" />
          </svg>
          <LinkBadge type={entry.link} raw={entry.link_type_draft} size="lg" />
        </div>
        <div className="pier pier-tr">
          <span className="pier-country">{t('common.tr')}</span>
          <span className="pier-name">
            <Name morphs={entry.seg.tr} lang="tr" numbered={numbered} />
          </span>
        </div>
      </div>
      {legend && (
        <div className="bridge-foot">
          {entry.link && <p className="link-desc">{t(`linkDesc.${entry.link}`)}</p>}
          <MorphLegend entry={entry} />
        </div>
      )}
    </section>
  );
}
