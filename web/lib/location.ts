import { isAddress, normalizeAddress } from './address';
import type { Loc } from './types';

/** The string shown in the address bar, and the string an about: page is reached by. */
export function locToString(loc: Loc): string {
  switch (loc.kind) {
    case 'site':
      return loc.address;
    case 'search':
      return `about:search?q=${encodeURIComponent(loc.q)}`;
    case 'history':
      return 'about:history';
    case 'publish':
      return 'about:publish';
    case 'start':
      return 'about:start';
  }
}

/** Parse something that was previously produced by locToString (URL param, stored entry). */
export function parseLoc(raw: string | null | undefined): Loc | null {
  if (!raw) return null;
  const s = raw.trim();
  const lower = s.toLowerCase();
  if (lower === 'about:start' || lower === 'about:blank') return { kind: 'start' };
  if (lower === 'about:history') return { kind: 'history' };
  if (lower === 'about:publish') return { kind: 'publish' };
  if (lower.startsWith('about:search')) {
    const q = new URLSearchParams(s.slice(s.indexOf('?') + 1)).get('q') ?? '';
    return q.trim() ? { kind: 'search', q } : { kind: 'start' };
  }
  const address = normalizeAddress(s);
  return isAddress(address) ? { kind: 'site', address } : null;
}

/**
 * What a person typed into the address bar. An address goes to that address, an about: page goes
 * to that page, and anything else is a search — the way every browser's omnibox behaves.
 */
export function parseTyped(input: string): Loc | null {
  const s = input.trim();
  if (!s) return null;
  const parsed = parseLoc(s);
  if (parsed) return parsed;
  if (/^about:/i.test(s)) return null;
  return { kind: 'search', q: s };
}

/** Real tab URL for an entry, so reload and the tab's own back/forward land in the same place. */
export function urlFor(loc: Loc): string {
  return loc.kind === 'start' ? '/' : `/?go=${encodeURIComponent(locToString(loc))}`;
}

export function locFromUrl(): Loc {
  if (typeof window === 'undefined') return { kind: 'start' };
  return parseLoc(new URLSearchParams(window.location.search).get('go')) ?? { kind: 'start' };
}

export function sameLoc(a: Loc | null | undefined, b: Loc | null | undefined): boolean {
  return !!a && !!b && locToString(a) === locToString(b);
}

