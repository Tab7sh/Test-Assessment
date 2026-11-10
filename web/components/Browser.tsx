'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { isAddress, normalizeAddress } from '@/lib/address';
import { api, ApiError } from '@/lib/api';
import { locFromUrl, locToString, parseTyped, sameLoc } from '@/lib/location';
import {
  canTraverse,
  Entry,
  loadEntry,
  NavState,
  neighbours,
  newKey,
  patchEntry,
  pushEntry,
  readState,
  replaceEntry,
  saveEntry,
} from '@/lib/session';
import type {
  DirectoryEntry,
  HistoryPage as HistorySnapshot,
  Loc,
  Page,
  Person,
  PublishDraft,
  SearchResponse,
  Via,
} from '@/lib/types';
import AddressBar from './AddressBar';
import HistoryPage from './HistoryPage';
import NavButton from './NavButton';
import Nowhere from './Nowhere';
import PageFrame from './PageFrame';
import PublishPage from './PublishPage';
import Scroller from './Scroller';
import SearchPage from './SearchPage';
import StartPage from './StartPage';

interface Resolved {
  revision?: number | null;
  found?: boolean;
  title?: string;
  snapshot?: unknown;
  page?: Page;
}

interface View {
  entry: Entry;
  page?: Page;
  /** A traversal landed on an entry we could not load: show that, at that position. */
  failed?: string;
}

const PERSON_KEY = 'sw:person';

function message(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

export default function Browser() {
  const [people, setPeople] = useState<Person[]>([]);
  const [personId, setPersonId] = useState<string | null>(null);
  const [view, setView] = useState<View | null>(null);
  const [nav, setNav] = useState<NavState | null>(null);
  const [pending, setPending] = useState<Loc | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);

  const personRef = useRef<string | null>(null);
  const navRef = useRef<NavState | null>(null);
  const shownRef = useRef<Entry | null>(null);
  /** Bumped by every navigation; a response only lands if its token is still current. */
  const tokenRef = useRef(0);
  const pendingIsTraversal = useRef(false);
  const pageCache = useRef(new Map<string, Page>());
  const scrollRef = useRef<{ key: string; y: number } | null>(null);
  const scrollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const visitWrites = useRef<Promise<void>>(Promise.resolve());
  const [visitError, setVisitError] = useState<string | null>(null);

  // ---- scroll bookkeeping ---------------------------------------------------------------

  const flushScroll = useCallback(() => {
    if (scrollTimer.current) clearTimeout(scrollTimer.current);
    scrollTimer.current = null;
    const s = scrollRef.current;
    if (s) patchEntry(s.key, { scroll: s.y });
    scrollRef.current = null;
  }, []);

  const onScroll = useCallback(
    (y: number) => {
      const key = shownRef.current?.key;
      if (!key) return;
      scrollRef.current = { key, y };
      if (scrollTimer.current) clearTimeout(scrollTimer.current);
      scrollTimer.current = setTimeout(flushScroll, 150);
    },
    [flushScroll],
  );

  useEffect(() => {
    window.addEventListener('pagehide', flushScroll);
    return () => window.removeEventListener('pagehide', flushScroll);
  }, [flushScroll]);

  // ---- loading what an entry shows ---------------------------------------------------------

  /**
   * Turn a location into something displayable. With `restore`, prefer what the entry recorded
   * when it was left (revision, snapshot) over asking what is there now.
   */
  const resolve = useCallback(async (loc: Loc, restore: Entry | null, seed?: unknown): Promise<Resolved> => {
    switch (loc.kind) {
      case 'site': {
        if (restore && restore.found === false) return { found: false, revision: null };
        const n = restore?.revision;
        let page: Page | undefined;
        if (typeof n === 'number') {
          page = pageCache.current.get(`${loc.address}@${n}`);
          if (!page) {
            page = await api.revision(loc.address, n).catch((e) => {
              if (e instanceof ApiError && e.status === 404) return undefined; // revision vanished (reseed)
              throw e;
            });
          }
        }
        if (!page) {
          try {
            page = await api.page(loc.address);
          } catch (e) {
            if (e instanceof ApiError && (e.status === 404 || e.status === 400)) return { found: false, revision: null };
            throw e;
          }
        }
        pageCache.current.set(`${page.address}@${page.revision}`, page);
        return { found: true, revision: page.revision, title: page.title, page };
      }
      case 'search': {
        if (restore?.snapshot) return { snapshot: restore.snapshot, title: restore.title };
        const res = await api.search(loc.q);
        return { snapshot: res, title: `${loc.q} — Search` };
      }
      case 'history': {
        await visitWrites.current;
        const snap = restore?.snapshot as HistorySnapshot | undefined;
        if (snap && snap.personId === personRef.current) return { snapshot: snap, title: 'History' };
        if (!personRef.current) return { snapshot: { personId: '', items: [], next: null }, title: 'History' };
        return { snapshot: await api.history(personRef.current), title: 'History' };
      }
      case 'start': {
        if (restore?.snapshot) return { snapshot: restore.snapshot, title: 'The small web' };
        return { snapshot: await api.directory(), title: 'The small web' };
      }
      case 'publish':
        return { snapshot: restore?.snapshot ?? seed ?? null, title: 'Publish' };
    }
  }, []);

  const commit = useCallback((state: NavState, entry: Entry, page?: Page, failed?: string) => {
    navRef.current = state;
    shownRef.current = entry;
    pendingIsTraversal.current = false;
    setNav(state);
    setView({ entry, page, failed });
    setPending(null);
    setHover(null);
  }, []);

  /** Visits are facts about arriving at an address; about: pages are not part of the web. */
  const recordVisit = useCallback((entry: Entry, via: Via, from: string | null) => {
    if (entry.loc.kind !== 'site' || !personRef.current) return;
    const visit = {
      clientId: newKey(),
      personId: personRef.current,
      address: entry.loc.address,
      revision: entry.found ? (entry.revision ?? null) : null,
      via,
      from,
    };
    visitWrites.current = visitWrites.current.then(async () => {
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          await api.recordVisit(visit);
          return;
        } catch (err) {
          if (attempt === 2) {
            setVisitError(`Could not save the visit to ${visit.address}: ${message(err)}. This arrival is missing from history.`);
          } else {
            await new Promise((done) => setTimeout(done, 250 * (attempt + 1)));
          }
        }
      }
    });
  }, []);

  // ---- the two ways to move: navigate (new entry) and traverse (existing entry) --------------

  const navigate = useCallback(
    async (loc: Loc, via: Via, opts: { replace?: boolean; seed?: unknown } = {}) => {
      flushScroll();
      const token = ++tokenRef.current;
      pendingIsTraversal.current = false;
      setPending(loc);
      setError(null);
      const current = shownRef.current;
      const from = current ? locToString(current.loc) : null;
      try {
        const r = await resolve(loc, null, opts.seed);
        if (token !== tokenRef.current) return; // superseded, stopped, or traversed away
        const entry: Entry = {
          key: newKey(),
          loc,
          revision: r.revision,
          found: r.found,
          title: r.title,
          scroll: 0,
          snapshot: r.snapshot,
        };
        // Like every browser: going to the address you are already on replaces, not pushes.
        const replace = opts.replace || (current != null && sameLoc(current.loc, loc));
        const state = replace ? replaceEntry(entry, navRef.current) : pushEntry(entry, navRef.current);
        commit(state, entry, r.page);
        recordVisit(entry, via, from);
      } catch (err) {
        if (token !== tokenRef.current) return;
        setPending(null);
        setError(message(err));
      }
    },
    [commit, flushScroll, recordVisit, resolve],
  );

  /**
   * Arrive at an entry that already exists in the tab's history — back, forward, or a reload.
   * The tab has *already* moved, so our position moves with it immediately, before loading.
   */
  const traverse = useCallback(
    async (state: NavState, via: Via, refresh = false) => {
      flushScroll();
      const token = ++tokenRef.current;
      navRef.current = state;
      setNav(state);
      const stored = loadEntry(state.key);
      const entry: Entry = stored ?? { key: state.key, loc: locFromUrl(), scroll: 0 };
      const from = shownRef.current ? locToString(shownRef.current.loc) : null;
      pendingIsTraversal.current = true;
      setPending(entry.loc);
      setError(null);
      try {
        const r = await resolve(entry.loc, stored && !refresh ? stored : null);
        if (token !== tokenRef.current) return;
        const shown: Entry = {
          ...entry,
          revision: r.revision,
          found: r.found,
          title: r.title ?? entry.title,
          snapshot: r.snapshot,
        };
        saveEntry(shown);
        commit(state, shown, r.page);
        recordVisit(shown, via, from);
      } catch (err) {
        if (token !== tokenRef.current) return;
        commit(state, entry, undefined, message(err));
      }
    },
    [commit, flushScroll, recordVisit, resolve],
  );

  const reload = useCallback(() => {
    const state = navRef.current;
    if (state) void traverse(state, 'reload', true);
  }, [traverse]);

  const stop = useCallback(() => {
    // A traversal cannot be "stopped" — the tab has already moved — so only cancel navigations.
    if (pendingIsTraversal.current) return;
    tokenRef.current++;
    setPending(null);
  }, []);

  // ---- wiring to the tab ---------------------------------------------------------------------

  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      const st = (e.state as { sw?: NavState } | null)?.sw;
      if (!st || typeof st.idx !== 'number') return;
      const prev = navRef.current;
      void traverse(st, prev && st.idx < prev.idx ? 'back' : 'forward');
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [traverse]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let list: Person[];
      try {
        list = await api.people();
      } catch (err) {
        if (!cancelled) setError(message(err));
        return;
      }
      if (cancelled) return;
      setPeople(list);
      const saved = window.localStorage.getItem(PERSON_KEY);
      const id = list.find((p) => p._id === saved)?._id ?? list[0]?._id ?? null;
      personRef.current = id;
      setPersonId(id);

      const existing = readState();
      if (existing) {
        // The tab was reloaded (or we came back to it): same entry, fresh content, same scroll.
        void traverse(existing, 'reload', true);
      } else {
        void navigate(locFromUrl(), 'typed', { replace: true });
      }
    })();
    return () => {
      cancelled = true;
      tokenRef.current++;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const e = view?.entry;
    const title = e ? (e.loc.kind === 'site' && e.found === false ? `${e.loc.address} — Nowhere` : (e.title ?? locToString(e.loc))) : null;
    document.title = title ? `${title} · small web` : 'small web';
  }, [view]);

  const choosePerson = useCallback(
    (id: string) => {
      personRef.current = id;
      setPersonId(id);
      window.localStorage.setItem(PERSON_KEY, id);
      if (shownRef.current?.loc.kind === 'history') reload();
    },
    [reload],
  );

  // ---- actions from the chrome and from pages -----------------------------------------------

  const go = useCallback((loc: Loc, via: Via) => void navigate(loc, via), [navigate]);
  const openAddress = useCallback(
    (address: string, via: Via) => go({ kind: 'site', address }, via),
    [go],
  );
  const followLink = useCallback(
    (href: string) => {
      const address = normalizeAddress(href);
      if (isAddress(address)) openAddress(address, 'link');
    },
    [openAddress],
  );
  const submitTyped = useCallback(
    (text: string) => {
      const loc = parseTyped(text);
      if (!loc) {
        setError(`"${text}" isn't an address or a page this browser has.`);
        return;
      }
      go(loc, 'typed');
    },
    [go],
  );
  const saveSnapshot = useCallback((snapshot: unknown) => {
    const e = shownRef.current;
    if (!e) return;
    flushScroll();
    const updated = { ...(loadEntry(e.key) ?? e), snapshot };
    shownRef.current = updated;
    saveEntry(updated);
    setView((current) => current?.entry.key === e.key ? { ...current, entry: updated } : current);
  }, [flushScroll]);

  // ---- render --------------------------------------------------------------------------------

  const can = canTraverse(nav);
  const near = neighbours(nav);
  const barLoc = pending ?? view?.entry.loc ?? null;
  const entry = view?.entry;
  const status: 'loading' | 'site' | 'nowhere' | 'about' | 'idle' = pending
    ? 'loading'
    : !entry
      ? 'idle'
      : entry.loc.kind === 'site'
        ? entry.found === false
          ? 'nowhere'
          : 'site'
        : 'about';
  const person = people.find((p) => p._id === personId);

  let content: React.ReactNode = null;
  if (entry && view?.failed) {
    content = (
      <Scroller key={entry.key} initialScroll={0} onScroll={onScroll}>
        <div className="internal narrow">
          <p className="eyebrow">Couldn't load</p>
          <h1 className="display">{locToString(entry.loc)}</h1>
          <p className="muted">{view.failed}</p>
          <button className="btn" onClick={reload}>Try again</button>
        </div>
      </Scroller>
    );
  } else if (entry) {
    const loc = entry.loc;
    if (loc.kind === 'site' && view?.page) {
      const page = view.page;
      content = (
        <div className="site-view">
          {page.revision < page.latest && (
            <div className="banner info">
              You're seeing this page as you left it (revision {page.revision}). It has been updated since.
              <button className="link-btn" onClick={reload}>Reload for the latest</button>
            </div>
          )}
          <PageFrame
            key={`${entry.key}:${page.revision}`}
            html={page.html}
            title={page.title}
            initialScroll={entry.scroll}
            detailsState={entry.details}
            onDetails={(details) => patchEntry(entry.key, { details })}
            onNavigate={followLink}
            onScroll={onScroll}
            onHover={setHover}
          />
        </div>
      );
    } else if (loc.kind === 'site') {
      content = (
        <Scroller key={entry.key} initialScroll={entry.scroll} onScroll={onScroll}>
          <Nowhere
            address={loc.address}
            onPublish={() => go({ kind: 'publish' }, 'link')}
            onPublishHere={() =>
              void navigate({ kind: 'publish' }, 'link', {
                seed: { address: loc.address, title: '', html: '', authorId: personRef.current ?? '' },
              })
            }
            onSearch={(q) => go({ kind: 'search', q }, 'typed')}
          />
        </Scroller>
      );
    } else if (loc.kind === 'search') {
      content = (
        <Scroller key={entry.key} initialScroll={entry.scroll} onScroll={onScroll}>
          <SearchPage
            data={entry.snapshot as SearchResponse}
            onOpen={(a) => openAddress(a, 'search')}
            onSearch={(q) => go({ kind: 'search', q }, 'typed')}
          />
        </Scroller>
      );
    } else if (loc.kind === 'history') {
      content = (
        <Scroller key={entry.key} initialScroll={entry.scroll} onScroll={onScroll}>
          <HistoryPage
            key={`${entry.key}:${(entry.snapshot as HistorySnapshot).personId}`}
            data={entry.snapshot as HistorySnapshot}
            personName={person?.name ?? ''}
            onOpen={(a) => openAddress(a, 'history')}
            onSnapshot={(snapshot) => {
              if (snapshot.personId === personRef.current && shownRef.current?.key === entry.key) saveSnapshot(snapshot);
            }}
          />
        </Scroller>
      );
    } else if (loc.kind === 'start') {
      content = (
        <Scroller key={entry.key} initialScroll={entry.scroll} onScroll={onScroll}>
          <StartPage
            sites={entry.snapshot as DirectoryEntry[]}
            onOpen={(a) => openAddress(a, 'directory')}
            onSearch={(q) => go({ kind: 'search', q }, 'typed')}
            onNavigate={(l) => go(l, 'typed')}
          />
        </Scroller>
      );
    } else if (loc.kind === 'publish') {
      content = (
        <Scroller key={entry.key} initialScroll={entry.scroll} onScroll={onScroll}>
          <PublishPage
            key={entry.key}
            draft={entry.snapshot as PublishDraft | null}
            people={people}
            personId={personId}
            onDraft={saveSnapshot}
            onPublished={(page) => openAddress(page.address, 'publish')}
          />
        </Scroller>
      );
    }
  }

  return (
    <div className="browser">
      <header className="toolbar">
        <NavButton
          direction="back"
          disabled={!can.back}
          entries={near.back}
          onClick={() => window.history.back()}
          onJump={(i) => window.history.go(-(i + 1))}
        />
        <NavButton
          direction="forward"
          disabled={!can.forward}
          entries={near.forward}
          onClick={() => window.history.forward()}
          onJump={(i) => window.history.go(i + 1)}
        />
        {pending && !pendingIsTraversal.current ? (
          <button className="icon-btn" title="Stop" aria-label="Stop" onClick={stop}>
            ✕
          </button>
        ) : (
          <button className="icon-btn" title="Reload" aria-label="Reload" onClick={reload} disabled={!nav}>
            ↻
          </button>
        )}
        <button className="icon-btn" title="Start page" aria-label="Start page" onClick={() => go({ kind: 'start' }, 'typed')}>
          ⌂
        </button>
        <AddressBar value={barLoc ? locToString(barLoc) : ''} status={status} onSubmit={submitTyped} />
        <button className="chip-btn" onClick={() => go({ kind: 'history' }, 'typed')}>
          History
        </button>
        <button className="chip-btn" onClick={() => go({ kind: 'publish' }, 'typed')}>
          Publish
        </button>
        <label className="person">
          <span>Browsing as</span>
          <select value={personId ?? ''} onChange={(e) => choosePerson(e.target.value)} disabled={!people.length}>
            {people.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
      </header>
      <div className={`progress${pending ? ' on' : ''}`} aria-hidden />
      {visitError && (
        <div className="banner error" role="alert">
          {visitError}
          <button className="link-btn" onClick={() => setVisitError(null)}>Dismiss</button>
        </div>
      )}
      {error && (
        <div className="banner error" role="alert">
          {error}
          <button className="link-btn" onClick={() => setError(null)}>
            Dismiss
          </button>
        </div>
      )}
      <main className="viewport">{content}</main>
      <footer className="statusbar">
        <span className="status-left">
          {hover
            ? isAddress(normalizeAddress(hover))
              ? normalizeAddress(hover)
              : hover.startsWith('#')
                ? `${barLoc ? locToString(barLoc) : ''}${hover}`
                : ''
            : pending
              ? `Loading ${locToString(pending)}…`
              : ''}
        </span>
        <span className="status-right">
          {view?.page && entry?.loc.kind === 'site' && entry.found !== false
            ? `${view.page.title} · by ${view.page.authorName} · revision ${view.page.revision}${view.page.latest > view.page.revision ? ` of ${view.page.latest}` : ''}`
            : ''}
        </span>
      </footer>
    </div>
  );
}

