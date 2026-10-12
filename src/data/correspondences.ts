/**
 * Regular sound correspondences shown on the "Дыбыстық сәйкестіктер" page.
 * `examples` are the author's examples; `suggested` are additional corpus
 * examples visible only in editor mode (?editor=1) for review.
 *
 * `key` is the LEXICON key (src/data/morphology.ts) used to count all corpus
 * pairs containing the component; `entry` is the card the example links to.
 * `mark` selects the letters highlighted in the example words.
 */

export interface SoundExample {
  kz: string;
  tr: string;
  entry: number;
  key: string;
}

export interface Correspondence {
  id: string;
  kz: string;
  tr: string;
  pos: 'initial' | 'initialFront' | 'final' | 'suffix';
  /** Letters to highlight: first / last occurrence, or the final suffix. */
  mark: { kz: string; tr: string; at: 'first' | 'last' | 'suffix' };
  examples: SoundExample[];
  suggested?: SoundExample[];
}

export const CORRESPONDENCES: Correspondence[] = [
  {
    id: 'zh-y',
    kz: 'ж',
    tr: 'y',
    pos: 'initial',
    mark: { kz: 'ж', tr: 'y', at: 'first' },
    examples: [
      { kz: 'жол', tr: 'yol', entry: 14, key: 'yol' },
      { kz: 'жасыл', tr: 'yeşil', entry: 57, key: 'jasil' },
      { kz: 'жұлдыз', tr: 'yıldız', entry: 27, key: 'yildiz' },
      { kz: 'жар', tr: 'yar', entry: 106, key: 'yar' },
    ],
    suggested: [
      { kz: 'жаңа', tr: 'yeni', entry: 23, key: 'yeni' },
      { kz: 'жапырақ', tr: 'yaprak', entry: 25, key: 'yaprak' },
      { kz: 'жеті', tr: 'yedi', entry: 63, key: 'yedi' },
      { kz: 'жаңбыр', tr: 'yağmur', entry: 61, key: 'yagmur' },
    ],
  },
  {
    id: 'k-g',
    kz: 'к',
    tr: 'g',
    pos: 'initialFront',
    mark: { kz: 'к', tr: 'g', at: 'first' },
    examples: [
      { kz: 'көк', tr: 'gök', entry: 70, key: 'gok' },
      { kz: 'көл', tr: 'göl', entry: 7, key: 'gol' },
      { kz: 'күміс', tr: 'gümüş', entry: 75, key: 'gumus' },
      { kz: 'киік', tr: 'geyik', entry: 77, key: 'geyik' },
    ],
  },
  {
    id: 't-d',
    kz: 'т',
    tr: 'd',
    pos: 'initial',
    mark: { kz: 'т', tr: 'd', at: 'first' },
    examples: [
      { kz: 'тау', tr: 'dağ', entry: 79, key: 'dag' },
      { kz: 'теңіз', tr: 'deniz', entry: 120, key: 'deniz' },
      { kz: 'темір', tr: 'demir', entry: 118, key: 'demir' },
    ],
  },
  {
    id: 's-sh',
    kz: 'с',
    tr: 'ş',
    pos: 'final',
    mark: { kz: 'с', tr: 'ş', at: 'last' },
    examples: [
      { kz: 'тас', tr: 'taş', entry: 80, key: 'tas' },
      { kz: 'бас', tr: 'baş', entry: 45, key: 'bas' },
      { kz: 'күміс', tr: 'gümüş', entry: 75, key: 'gumus' },
    ],
    suggested: [{ kz: 'құс', tr: 'kuş', entry: 98, key: 'kus' }],
  },
  {
    id: 'sh-ch',
    kz: 'ш',
    tr: 'ç',
    pos: 'initial',
    mark: { kz: 'ш', tr: 'ç', at: 'first' },
    examples: [{ kz: 'шыбық', tr: 'çubuk', entry: 126, key: 'cubuk' }],
    suggested: [
      { kz: 'үш', tr: 'üç', entry: 128, key: 'uc' },
      { kz: 'құсшы', tr: 'kuşçu', entry: 98, key: 'ci' },
    ],
  },
  {
    id: 'm-b',
    kz: 'м',
    tr: 'b',
    pos: 'initial',
    mark: { kz: 'м', tr: 'b', at: 'first' },
    examples: [{ kz: 'мұз', tr: 'buz', entry: 66, key: 'buz' }],
  },
  {
    id: 'suffix-li',
    kz: '-лы/-ды',
    tr: '-lı/-li/-lu/-lü',
    pos: 'suffix',
    mark: { kz: '', tr: '', at: 'suffix' },
    examples: [
      { kz: 'Балталы', tr: 'Baltalı', entry: 41, key: 'li' },
      { kz: 'Алматы', tr: 'Elmalı', entry: 38, key: 'li' },
    ],
    suggested: [
      { kz: 'Жапырақты', tr: 'Yapraklı', entry: 25, key: 'li' },
      { kz: 'Жүзімді', tr: 'Üzümlü', entry: 26, key: 'li' },
      { kz: 'Киікті', tr: 'Geyikli', entry: 77, key: 'li' },
    ],
  },
];
