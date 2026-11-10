import type {
  DirectoryEntry,
  HistoryItem,
  HistoryPage,
  Page,
  Person,
  PublishDraft,
  SearchResponse,
  Via,
} from './types';

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(API_URL + path, {
      ...init,
      headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
      cache: 'no-store',
    });
  } catch {
    throw new ApiError(0, `Can't reach the small web at ${API_URL}. Is the API running?`);
  }
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { message?: string | string[] } | null;
    const msg = Array.isArray(body?.message) ? body.message.join('; ') : body?.message;
    throw new ApiError(res.status, msg ?? res.statusText);
  }
  return res.json() as Promise<T>;
}

const enc = encodeURIComponent;

export const api = {
  people: () => req<Person[]>('/people'),
  directory: () => req<DirectoryEntry[]>('/sites'),
  page: (address: string) => req<Page>(`/sites/${enc(address)}`),
  revision: (address: string, n: number) => req<Page>(`/sites/${enc(address)}/revisions/${n}`),
  search: (q: string) => req<SearchResponse>(`/search?q=${enc(q)}`),
  history: (personId: string, before?: string | null) =>
    req<HistoryPage>(`/people/${enc(personId)}/visits?limit=40${before ? `&before=${enc(before)}` : ''}`),
  recordVisit: (v: { clientId?: string; personId: string; address: string; revision: number | null; via: Via; from: string | null }) =>
    req<HistoryItem>('/visits', { method: 'POST', body: JSON.stringify(v) }),
  publish: (d: PublishDraft) => req<Page>('/sites', { method: 'POST', body: JSON.stringify(d) }),
  preview: (html: string) => req<{ html: string }>('/preview', { method: 'POST', body: JSON.stringify({ html }) }),
};

