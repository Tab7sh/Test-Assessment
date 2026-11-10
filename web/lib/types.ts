export interface Person {
  _id: string;
  name: string;
}

export interface Page {
  address: string;
  revision: number;
  latest: number;
  title: string;
  html: string;
  authorId: string;
  authorName: string;
  publishedAt: string;
}

export interface DirectoryEntry {
  address: string;
  title: string;
  authorId: string;
  authorName: string;
  revision: number;
  updatedAt: string;
}

export interface SearchHit {
  address: string;
  title: string;
  authorName: string;
  snippet: string;
  score: number;
}

export interface SearchResponse {
  q: string;
  terms: string[];
  results: SearchHit[];
}

export interface HistoryItem {
  id: string;
  address: string;
  title: string | null;
  revision: number | null;
  found: boolean;
  via: Via;
  from: string | null;
  at: string;
}

export interface HistoryPage {
  personId: string;
  items: HistoryItem[];
  next: string | null;
}

export type Via =
  | 'typed'
  | 'link'
  | 'search'
  | 'history'
  | 'directory'
  | 'publish'
  | 'back'
  | 'forward'
  | 'reload';

/** Where the browser can be. Sites are addresses; everything else is the browser's own page. */
export type Loc =
  | { kind: 'site'; address: string }
  | { kind: 'search'; q: string }
  | { kind: 'history' }
  | { kind: 'publish' }
  | { kind: 'start' };

export interface PublishDraft {
  address: string;
  title: string;
  html: string;
  authorId: string;
}

