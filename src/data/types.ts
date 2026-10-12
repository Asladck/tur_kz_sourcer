export const LINK_TYPES = ['cognate', 'partial', 'calque', 'shared_loan', 'doubtful'] as const;
export type LinkType = (typeof LINK_TYPES)[number];

export const OBJ_CATS = ['oikonym', 'hydronym', 'oronym', 'choronym', 'unspecified'] as const;
export type ObjCat = (typeof OBJ_CATS)[number];

export type SideKey = 'kz' | 'tr';

/** One side of a pair exactly as stored in toponyms_kz_tr.json. */
export interface RawSide {
  name: string;
  type: string | null;
  location: string | null;
  structure: string | null;
  etymology: string | null;
  /** Optional Russian translation of the etymology (shown in the Russian interface). */
  etymology_ru?: string | null;
  lat: number | null;
  lon: number | null;
  name_in_source?: string;
}

export interface RawEntry {
  id: number;
  kz: RawSide;
  tr: RawSide;
  link_type_draft: string;
  review_notes: string | null;
  verified: boolean;
  sources: unknown[];
}

export interface RawData {
  meta: {
    title: string;
    entries: number;
    source_numbering_gaps?: number[];
    link_types: Record<string, string>;
    note?: string;
    sources?: unknown[];
  };
  entries: RawEntry[];
}

/** A morpheme of a segmented name. */
export interface Morph {
  text: string;
  /** Lexicon key; one-sided keys are prefixed with "kz:" / "tr:". */
  key: string;
  /** Index of the alignment pair (shared colour) or null. */
  pair: number | null;
  /** 'shared' — same root on both sides, 'semantic' — equivalent meaning only. */
  mode: 'shared' | 'semantic' | null;
}

export interface Entry extends RawEntry {
  link: LinkType | null;
  kzCat: ObjCat;
  trCat: ObjCat;
  seg: { kz: Morph[]; tr: Morph[] };
  /** Lexicon keys present on the KZ / TR side. */
  kzKeys: Set<string>;
  trKeys: Set<string>;
  /** Folded text used by the search box. */
  haystack: string;
}
