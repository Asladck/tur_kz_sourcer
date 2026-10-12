import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { useI18n } from '../i18n/i18n';
import { globalSearch } from '../lib/search';
import { Icon, LinkBadge } from './ui';

type Item = { kind: 'entry'; id: number } | { kind: 'comp'; key: string };

/** Global search palette (Ctrl/Cmd+K): names, numbers and components. */
export function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, lp } = useI18n();
  const navigate = useNavigate();
  const ref = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const listId = useId();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      d.showModal();
      setActive(0);
      requestAnimationFrame(() => inputRef.current?.select());
    } else if (!open && d.open) d.close();
  }, [open]);

  const results = useMemo(() => globalSearch(query), [query]);
  const items: Item[] = useMemo(
    () => [
      ...results.entries.map((e) => ({ kind: 'entry' as const, id: e.id })),
      ...results.components.map((c) => ({ kind: 'comp' as const, key: c.key })),
    ],
    [results],
  );

  useEffect(() => setActive(0), [query]);

  const go = (item: Item | undefined) => {
    if (!item) return;
    onClose();
    navigate(item.kind === 'entry' ? lp(`/entry/${item.id}`) : lp(`/dictionary?comp=${item.key}`));
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      go(items[active]);
    }
  };

  const optId = (i: number) => `${listId}-opt-${i}`;
  let index = -1;

  return (
    <dialog
      ref={ref}
      className="search-dialog"
      aria-label={t('search.title')}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
    >
      <div className="search-box">
        <div className="search-input-row">
          <Icon name="search" size={20} />
          <input
            ref={inputRef}
            type="search"
            role="combobox"
            aria-expanded={items.length > 0}
            aria-controls={listId}
            aria-activedescendant={items.length ? optId(active) : undefined}
            aria-autocomplete="list"
            aria-label={t('search.title')}
            placeholder={t('search.placeholder')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKey}
            autoComplete="off"
            spellCheck={false}
          />
          <button type="button" className="icon-btn" onClick={onClose} aria-label={t('a11y.close')}>
            <Icon name="close" />
          </button>
        </div>

        <div id={listId} role="listbox" className="search-results" aria-label={t('search.title')}>
          {!query.trim() && <p className="search-empty">{t('search.start')}</p>}
          {query.trim() && !items.length && <p className="search-empty">{t('search.empty')}</p>}
          {results.entries.length > 0 && (
            <div role="group" aria-label={t('search.entries')}>
              <div className="search-group">{t('search.entries')}</div>
              {results.entries.map((e) => {
                index++;
                const i = index;
                return (
                  <div
                    key={e.id}
                    id={optId(i)}
                    role="option"
                    aria-selected={active === i}
                    className="search-option"
                    onMouseMove={() => setActive(i)}
                    onClick={() => go({ kind: 'entry', id: e.id })}
                  >
                    <span className="so-id">№{e.id}</span>
                    <span className="so-names">
                      <span className="so-kz" lang="kk">{e.kz.name}</span>
                      <span className="so-sep" aria-hidden="true">—</span>
                      <span className="so-tr" lang="tr">{e.tr.name}</span>
                    </span>
                    <LinkBadge type={e.link} raw={e.link_type_draft} />
                  </div>
                );
              })}
            </div>
          )}
          {results.components.length > 0 && (
            <div role="group" aria-label={t('search.components')}>
              <div className="search-group">{t('search.components')}</div>
              {results.components.map((c) => {
                index++;
                const i = index;
                return (
                  <div
                    key={c.key}
                    id={optId(i)}
                    role="option"
                    aria-selected={active === i}
                    className="search-option"
                    onMouseMove={() => setActive(i)}
                    onClick={() => go({ kind: 'comp', key: c.key })}
                  >
                    <span className="so-comp">{c.label}</span>
                    <span className="so-count">{t('search.componentCount', { n: c.count })}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="search-foot" aria-hidden="true">
          <span>
            <kbd><Icon name="arrow-up" size={12} /></kbd>
            <kbd className="kbd-down"><Icon name="arrow-up" size={12} /></kbd> {t('search.hintMove')}
          </span>
          <span>
            <kbd><Icon name="enter" size={12} /></kbd> {t('search.hintOpen')}
          </span>
          <span>
            <kbd>Esc</kbd> {t('search.hintClose')}
          </span>
        </div>
      </div>
    </dialog>
  );
}
