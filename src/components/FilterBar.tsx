import { useState, type ReactNode } from 'react';
import { componentLabel } from '../data/dataset';
import { COMPONENT_FILTERS } from '../data/morphology';
import { LINK_TYPES, OBJ_CATS } from '../data/types';
import { useI18n } from '../i18n/i18n';
import { activeFilterCount, type Filters, type ListKey } from '../lib/filters';
import { Icon, LinkSwatch, ObjShape } from './ui';

interface Props {
  filters: Filters;
  toggle: (key: ListKey, value: string) => void;
  update: (patch: Partial<Filters>) => void;
  clear: () => void;
  found: number;
  /** Extra actions on the right of the counter (CSV export…). */
  actions?: ReactNode;
  /** Collapsed by default (map page, small screens). */
  collapsible?: boolean;
}

function Chip({ pressed, onClick, children }: { pressed: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" className="chip" aria-pressed={pressed} onClick={onClick}>
      {children}
      {pressed && <Icon name="close" size={12} />}
    </button>
  );
}

/**
 * Filter chips over the dictionary table and the map. State lives in the URL
 * (useFilters), so "back" restores the selection and links can be shared.
 */
export function FilterBar({ filters, toggle, update, clear, found, actions, collapsible = false }: Props) {
  const { t } = useI18n();
  const active = activeFilterCount(filters);
  const [open, setOpen] = useState(() => !collapsible && (typeof window === 'undefined' || window.innerWidth >= 760));
  const comps = [...COMPONENT_FILTERS, ...filters.comp.filter((c) => !COMPONENT_FILTERS.includes(c))];

  return (
    <section className={`filter-bar${open ? ' is-open' : ''}`} aria-label={t('filters.title')}>
      <div className="fb-top">
        <label className="fb-search">
          <Icon name="search" />
          <span className="sr-only">{t('filters.search')}</span>
          <input
            type="search"
            value={filters.q}
            placeholder={t('filters.searchPlaceholder')}
            onChange={(e) => update({ q: e.target.value })}
            autoComplete="off"
            spellCheck={false}
          />
        </label>
        <button type="button" className="btn btn-secondary fb-toggle" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          <Icon name="filter" />
          {t('filters.title')}
          {active > 0 && <span className="count-pill">{active}</span>}
        </button>
        <span className="fb-found" aria-live="polite">
          {t('filters.found', { n: found })}
        </span>
        {active > 0 && (
          <button type="button" className="btn btn-ghost fb-reset" onClick={clear}>
            <Icon name="close" />
            {t('filters.reset')}
          </button>
        )}
        {actions && <div className="fb-actions">{actions}</div>}
      </div>

      {open && (
        <div className="fb-groups">
          <div className="fb-group" role="group" aria-label={t('filters.type')}>
            <span className="fb-label">{t('filters.type')}</span>
            <div className="chips">
              {LINK_TYPES.map((k) => (
                <Chip key={k} pressed={filters.type.includes(k)} onClick={() => toggle('type', k)}>
                  <LinkSwatch type={k} />
                  {t(`link.${k}`)}
                </Chip>
              ))}
            </div>
          </div>
          <div className="fb-group" role="group" aria-label={t('filters.obj')}>
            <span className="fb-label">{t('filters.obj')}</span>
            <div className="chips">
              {OBJ_CATS.map((c) => (
                <Chip key={c} pressed={filters.obj.includes(c)} onClick={() => toggle('obj', c)}>
                  <ObjShape cat={c} size={11} />
                  {t(`obj.${c}`)}
                </Chip>
              ))}
            </div>
          </div>
          <div className="fb-group" role="group" aria-label={t('filters.comp')}>
            <span className="fb-label">{t('filters.comp')}</span>
            <div className="chips">
              {comps.map((c) => (
                <Chip key={c} pressed={filters.comp.includes(c)} onClick={() => toggle('comp', c)}>
                  <span className="chip-comp">{componentLabel(c)}</span>
                </Chip>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
