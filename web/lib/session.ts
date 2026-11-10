/**
 * SESSION HISTORY — how back and forward are made to hold.
 *
 * The tab's own history (window.history) is the single source of truth for *position*. Every
 * navigation in our browser is a real pushState, so the tab's back/forward buttons, Alt+←/→,
 * mouse side-buttons and our own toolbar buttons all move through the same list, and the
 * platform truncates the forward list for us when someone navigates from the middle of it.
 *
 * Each history state carries only { key, idx }. What that entry *was* — which address, which
 * revision was displayed, how far down it had been scrolled, the search results or history rows
 * that were on screen, a half-written publish form — lives in sessionStorage under the key. So a
 * traversal restores the page that was left rather than re-asking the server what is there now,
 * and a reload of the tab restores it too.
 *
 * Our toolbar buttons call history.back()/forward(); nothing else moves the position.
 */
import { urlFor } from './location';
import type { Loc } from './types';

export interface Entry {
  key: string;
  loc: Loc;
  /** For sites: the revision that was displayed, or null if the address led nowhere. */
  revision?: number | null;
  found?: boolean;
  title?: string;
  scroll: number;
  details?: boolean[];
  /** Whatever an about: page needs to look exactly as it was left. */
  snapshot?: unknown;
}

export interface NavState {
  key: string;
  idx: number;
}

const ENTRY = 'sw:entry:';
const STACK = 'sw:stack';

function store(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export function newKey(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function readState(): NavState | null {
  const s = (window.history.state as { sw?: NavState } | null)?.sw;
  return s && typeof s.key === 'string' && typeof s.idx === 'number' ? s : null;
}

/** Keys of our entries, by index, mirroring the tab's list for the part of it that is ours. */
function stack(): string[] {
  try {
    return JSON.parse(store()?.getItem(STACK) ?? '[]') as string[];
  } catch {
    return [];
  }
}

function setStack(keys: string[]) {
  store()?.setItem(STACK, JSON.stringify(keys));
}

export function loadEntry(key: string): Entry | null {
  try {
    const raw = store()?.getItem(ENTRY + key);
    return raw ? (JSON.parse(raw) as Entry) : null;
  } catch {
    return null;
  }
}

export function saveEntry(entry: Entry) {
  try {
    store()?.setItem(ENTRY + entry.key, JSON.stringify(entry));
  } catch {
    // Storage full: drop the snapshot rather than lose the position.
    try {
      store()?.setItem(ENTRY + entry.key, JSON.stringify({ ...entry, snapshot: undefined }));
    } catch {
      /* nothing more we can do */
    }
  }
}

export function patchEntry(key: string, patch: Partial<Entry>) {
  const current = loadEntry(key);
  if (current) saveEntry({ ...current, ...patch });
}

/** A new navigation: everything forward of here is lost, exactly as the platform does it. */
export function pushEntry(entry: Entry, from: NavState | null): NavState {
  const idx = from ? from.idx + 1 : 0;
  const keys = stack();
  for (const lost of keys.splice(idx)) store()?.removeItem(ENTRY + lost);
  keys[idx] = entry.key;
  setStack(keys);
  saveEntry(entry);
  const state: NavState = { key: entry.key, idx };
  window.history.pushState({ sw: state }, '', urlFor(entry.loc));
  return state;
}

/** Replace the current entry in place (reload, same-address navigation, first load). */
export function replaceEntry(entry: Entry, at: NavState | null): NavState {
  const idx = at?.idx ?? 0;
  const keys = at ? stack() : [];
  if (keys[idx] && keys[idx] !== entry.key) store()?.removeItem(ENTRY + keys[idx]);
  keys[idx] = entry.key;
  setStack(keys);
  saveEntry(entry);
  const state: NavState = { key: entry.key, idx };
  window.history.replaceState({ ...(window.history.state ?? {}), sw: state }, '', urlFor(entry.loc));
  return state;
}

export function canTraverse(state: NavState | null): { back: boolean; forward: boolean } {
  if (!state) return { back: false, forward: false };
  return { back: state.idx > 0, forward: state.idx < stack().length - 1 };
}

/** Entries before and after the current one, for the long-press menus on back and forward. */
export function neighbours(state: NavState | null): { back: Entry[]; forward: Entry[] } {
  if (!state) return { back: [], forward: [] };
  const keys = stack();
  const load = (k: string | undefined) => (k ? loadEntry(k) : null);
  const back = keys.slice(0, state.idx).map(load).filter(Boolean).reverse() as Entry[];
  const forward = keys.slice(state.idx + 1).map(load).filter(Boolean) as Entry[];
  return { back, forward };
}

