import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router';
import { FilterBar } from '../components/FilterBar';
import { Breadcrumbs } from '../components/Nav';
import { Icon, LinkBadge, ObjBadge, VerifiedBadge } from '../components/ui';
import { entries } from '../data/dataset';
import { LINK_TYPES, OBJ_CATS, type Entry } from '../data/types';
import { useI18n } from '../i18n/i18n';
import { downloadText, entriesToCsv } from '../lib/csv';
import { useEditor } from '../lib/editor';
import { applyFilters, useFilters } from '../lib/filters';
import { usePageMeta } from '../lib/meta';

type SortKey = 'id' | 'kz' | 'tr' | 'obj' | 'link';
const kkCollator = new Intl.Collator('kk');
const trCollator = new Intl.Collator('tr');

const COMPARE: Record<SortKey, (a: Entry, b: Entry) => number> = {
  id: (a, b) => a.id - b.id,
  kz: (a, b) => kkCollator.compare(a.kz.name, b.kz.name),
  tr: (a, b) => trCollator.compare(a.tr.name, b.tr.name),
  obj: (a, b) => OBJ_CATS.indexOf(a.kzCat) - OBJ_CATS.indexOf(b.kzCat) || OBJ_CATS.indexOf(a.trCat) - OBJ_CATS.indexOf(b.trCat),
  link: (a, b) => (LINK_TYPES as readonly string[]).indexOf(a.link_type_draft) - (LINK_TYPES as readonly string[]).indexOf(b.link_type_draft),
};

export default function Dictionary() {
  const { t, lp } = useI18n();
  const editor = useEditor();
  const navigate = useNavigate();
  const { filters, update, toggle, clear, params, setParams } = useFilters();
  usePageMeta(t('meta.dictionary.title'), t('meta.dictionary.description'));

  const sort = (params.get('sort') as SortKey) || 'id';
  const desc = params.get('dir') === 'desc';

  const rows = useMemo(() => {
    const cmp = COMPARE[sort] ?? COMPARE.id;
    return applyFilters(entries, filters).sort((a, b) => (desc ? -1 : 1) * (cmp(a, b) || a.id - b.id));
  }, [filters, sort, desc]);

  const toggleSort = (key: SortKey) => {
    setParams(
      (prev) => {
        const p = new URLSearchParams(prev);
        if (sort === key) p.set('dir', desc ? 'asc' : 'desc');
        else {
          p.set('sort', key);
          p.delete('dir');
        }
        return p;
      },
      { replace: true },
    );
  };

  const header = (key: SortKey, label: string) => (
    <th scope="col" aria-sort={sort === key ? (desc ? 'descending' : 'ascending') : 'none'} className={key === 'id' ? 'col-id' : undefined}>
      <button type="button" className="sort-btn" onClick={() => toggleSort(key)} title={t('dict.sortBy', { col: label })}>
        {label}
        <span className="sort-ind">
          <Icon name={sort === key ? (desc ? 'sort-desc' : 'sort-asc') : 'sort'} size={13} />
        </span>
      </button>
    </th>
  );

  // Keep the current selection in the entry links, so "back" and the pager share it.
  const entryLink = (id: number) => lp(`/entry/${id}`);

  return (
    <div className="container page-body">
      <Breadcrumbs items={[{ label: t('nav.dictionary') }]} />
      <header className="page-head">
        <h1>{t('dict.title')}</h1>
        <p className="lead">{t('dict.lead')}</p>
      </header>

      <FilterBar
        filters={filters}
        toggle={toggle}
        update={update}
        clear={clear}
        found={rows.length}
        actions={
          <button
            type="button"
            className="btn btn-secondary btn-small"
            title={t('dict.exportHint')}
            disabled={!rows.length}
            onClick={() => downloadText(`toponyms_kz_tr_${rows.length}.csv`, entriesToCsv(rows, editor))}
          >
            <Icon name="download" />
            {t('dict.export', { n: rows.length })}
          </button>
        }
      />

      {rows.length ? (
        <div className="table-wrap">
          <table className="data-table dict-table">
            <thead>
              <tr>
                {header('id', t('dict.colId'))}
                {header('kz', t('dict.colKz'))}
                {header('tr', t('dict.colTr'))}
                {header('obj', t('dict.colObj'))}
                {header('link', t('dict.colLink'))}
                <th scope="col">{t('dict.colStatus')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => (
                <tr key={e.id} onClick={(ev) => !(ev.target as HTMLElement).closest('a, button') && navigate(entryLink(e.id))}>
                  <td className="col-id">{e.id}</td>
                  <td className="col-name kz-name">
                    <Link to={entryLink(e.id)} lang="kk">
                      {e.kz.name}
                    </Link>
                  </td>
                  <td className="col-name tr-name">
                    <Link to={entryLink(e.id)} lang="tr" tabIndex={-1}>
                      {e.tr.name}
                    </Link>
                  </td>
                  <td className="col-obj">
                    <ObjBadge cat={e.kzCat} side="kz" />
                    <ObjBadge cat={e.trCat} side="tr" />
                  </td>
                  <td className="col-link">
                    <LinkBadge type={e.link} raw={e.link_type_draft} />
                  </td>
                  <td className="col-status">
                    <VerifiedBadge verified={e.verified} />
                    {editor && e.review_notes && (
                      <span className="editor-dot" title={e.review_notes}>
                        !
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="empty">{t('dict.empty')}</p>
      )}
    </div>
  );
}
