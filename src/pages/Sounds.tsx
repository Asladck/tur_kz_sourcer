import { Link } from 'react-router';
import { Breadcrumbs } from '../components/Nav';
import { RamHornDivider } from '../components/Ornaments';
import { Icon } from '../components/ui';
import { CORRESPONDENCES, type Correspondence, type SoundExample } from '../data/correspondences';
import { entriesWithShared } from '../data/dataset';
import { useI18n } from '../i18n/i18n';
import { useEditor } from '../lib/editor';
import { usePageMeta } from '../lib/meta';

/** Wraps the corresponding letter(s) of a word in <mark>. */
function Marked({ word, letter, at, lang }: { word: string; letter: string; at: Correspondence['mark']['at']; lang: string }) {
  let start = -1;
  let len = letter.length;
  if (at === 'suffix') {
    len = 2;
    start = word.length - 2;
  } else {
    const lw = word.toLocaleLowerCase(lang);
    start = at === 'first' ? lw.indexOf(letter) : lw.lastIndexOf(letter);
  }
  if (start < 0) return <>{word}</>;
  return (
    <>
      {word.slice(0, start)}
      <mark>{word.slice(start, start + len)}</mark>
      {word.slice(start + len)}
    </>
  );
}

function Example({ c, ex, suggested }: { c: Correspondence; ex: SoundExample; suggested?: boolean }) {
  const { t, lp } = useI18n();
  const n = entriesWithShared(ex.key).length;
  return (
    <li className={`sound-ex${suggested ? ' suggested' : ''}`}>
      <Link to={lp(`/entry/${ex.entry}`)} className="sound-pair">
        <span lang="kk"><Marked word={ex.kz} letter={c.mark.kz} at={c.mark.at} lang="kk" /></span>
        <span className="pair-arrow">
          <Icon name="bridge" size={14} />
        </span>
        <span lang="tr"><Marked word={ex.tr} letter={c.mark.tr} at={c.mark.at} lang="tr" /></span>
        <span className="sound-id">№ {ex.entry}</span>
      </Link>
      {n > 1 && (
        <Link to={lp(`/dictionary?comp=${ex.key}`)} className="sound-count">
          {t('sounds.inCorpus', { n })}
        </Link>
      )}
      {suggested && <span className="editor-tag" title={t('editor.suggestedHint')}>{t('editor.suggested')}</span>}
    </li>
  );
}

export default function Sounds() {
  const { t } = useI18n();
  const editor = useEditor();
  usePageMeta(t('meta.sounds.title'), t('meta.sounds.description'));
  return (
    <div className="container page-body">
      <Breadcrumbs items={[{ label: t('sounds.title') }]} />
      <header className="page-head">
        <h1>{t('sounds.title')}</h1>
        <p className="lead">{t('sounds.lead')}</p>
      </header>
      <RamHornDivider />
      <div className="table-wrap">
        <table className="data-table sounds-table">
          <thead>
            <tr>
              <th scope="col">{t('sounds.colCorr')}</th>
              <th scope="col">{t('sounds.colPos')}</th>
              <th scope="col">{t('sounds.colExamples')}</th>
            </tr>
          </thead>
          <tbody>
            {CORRESPONDENCES.map((c) => (
              <tr key={c.id}>
                <th scope="row" className="sound-corr">
                  <span className="corr-kz" lang="kk">{c.kz}</span>
                  <span className="pair-arrow">
                    <Icon name="bridge" size={18} />
                  </span>
                  <span className="corr-tr" lang="tr">{c.tr}</span>
                </th>
                <td className="sound-pos" data-label={t('sounds.colPos')}>{t(`sounds.pos.${c.pos}`)}</td>
                <td data-label={t('sounds.colExamples')}>
                  <ul className="sound-examples">
                    {c.examples.map((ex) => (
                      <Example key={ex.kz} c={c} ex={ex} />
                    ))}
                    {editor && c.suggested?.map((ex) => <Example key={ex.kz} c={c} ex={ex} suggested />)}
                  </ul>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
