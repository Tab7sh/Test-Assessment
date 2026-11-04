'use client';

import { useEffect, useMemo, useRef } from 'react';

/**
 * CONTAINMENT, LAYER 2 OF 2 — where a stranger's HTML meets our interface.
 *
 * The page is rendered in its own document inside an iframe with:
 *
 *   sandbox="allow-same-origin"      ← THE LINE. Deliberately *without* allow-scripts.
 *
 *  - No allow-scripts: nothing in the page can execute, whatever survived sanitising.
 *    (allow-scripts together with allow-same-origin would let the page remove its own sandbox;
 *    we never grant both.)
 *  - No allow-top-navigation / allow-popups / allow-forms / allow-modals: the page cannot move
 *    our tab, open windows, submit anything, or raise dialogs.
 *  - allow-same-origin exists only so *our* code can reach in: we intercept link clicks and turn
 *    them into browser navigations, and we read and restore the scroll position.
 *  - A CSP in the document forbids every fetch except inline styles: no images, fonts, frames,
 *    CSS imports, or form posts — the page has no network.
 *  - Being a separate document, its CSS (even position:fixed overlays) cannot reach our chrome.
 *
 * The iframe is re-mounted per history entry (see `key` at the call site). Changing srcdoc on a
 * live iframe would add entries to the tab's joint session history and break back/forward.
 */
const CSP =
  "default-src 'none'; style-src 'unsafe-inline'; img-src 'none'; font-src 'none'; media-src 'none'; frame-src 'none'; form-action 'none'; base-uri 'none'";

const BASE_STYLE = `
  :root { color-scheme: light; }
  html { -webkit-text-size-adjust: 100%; }
  body { margin: 0 auto; padding: 32px 28px 64px; max-width: 72ch; font: 17px/1.65 Charter, "Iowan Old Style", Georgia, serif; color: #1f2328; background: #fff; overflow-wrap: anywhere; }
  h1, h2, h3 { line-height: 1.2; }
  a { color: #1f5fbf; }
  a:not([href]) { color: inherit; text-decoration: none; }
  pre { overflow-x: auto; }
  table { max-width: 100%; }
`;

export function buildDocument(html: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${CSP}"><meta name="referrer" content="no-referrer"><style>${BASE_STYLE}</style></head><body>${html}</body></html>`;
}

interface Props {
  html: string;
  title: string;
  initialScroll?: number;
  detailsState?: boolean[];
  onDetails?: (open: boolean[]) => void;
  /** A link to an address was activated. Absent → links are inert (e.g. publish preview). */
  onNavigate?: (href: string) => void;
  onScroll?: (y: number) => void;
  onHover?: (href: string | null) => void;
}

type AnchorLike = { getAttribute(name: string): string | null };

function anchorFrom(target: EventTarget | null): AnchorLike | null {
  // Elements in the frame belong to another realm; `instanceof Element` would be false.
  const el = target as { closest?: (sel: string) => AnchorLike | null } | null;
  return el && typeof el.closest === 'function' ? el.closest('a') : null;
}

export default function PageFrame({ html, title, initialScroll = 0, detailsState, onDetails, onNavigate, onScroll, onHover }: Props) {
  const ref = useRef<HTMLIFrameElement>(null);
  const srcDoc = useMemo(() => buildDocument(html), [html]);
  const cb = useRef({ onNavigate, onScroll, onHover, onDetails });
  cb.current = { onNavigate, onScroll, onHover, onDetails };
  const initial = useRef(initialScroll);
  const cleanup = useRef<() => void>(() => undefined);

  useEffect(() => () => cleanup.current(), []);

  const handleLoad = () => {
    cleanup.current();
    const frame = ref.current;
    const doc = frame?.contentDocument;
    const win = frame?.contentWindow;
    if (!doc || !win) return;

    const details = [...doc.querySelectorAll('details')];
    detailsState?.forEach((open, i) => { if (details[i]) details[i].open = open; });
    const onToggle = () => cb.current.onDetails?.(details.map((element) => element.open));
    doc.addEventListener('toggle', onToggle, true);

    if (initial.current > 0) win.scrollTo(0, initial.current);

    const onClick = (e: MouseEvent) => {
      const a = anchorFrom(e.target);
      if (!a) return;
      // Every activation is ours to handle. If the frame navigated itself it would also
      // push onto the tab's history behind our back.
      e.preventDefault();
      if (e.type === 'auxclick' && e.button !== 1) return;
      const href = a.getAttribute('href');
      if (!href) return;
      if (href.startsWith('#')) {
        let id = href.slice(1);
        try { id = decodeURIComponent(id); } catch { /* A malformed fragment is still inert. */ }
        const target = id ? doc.getElementById(id) ?? doc.getElementsByName(id)[0] : doc.body;
        target?.scrollIntoView({ block: 'start' });
        if (!id) win.scrollTo(0, 0);
        return;
      }
      cb.current.onNavigate?.(href);
    };
    const onSubmit = (e: Event) => e.preventDefault();
    let ticking = false;
    const onScrollEvt = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        cb.current.onScroll?.(Math.round(win.scrollY));
      });
    };
    const onOver = (e: MouseEvent) => {
      const a = anchorFrom(e.target);
      cb.current.onHover?.(a?.getAttribute('href') ?? null);
    };
    const onLeave = () => cb.current.onHover?.(null);

    doc.addEventListener('click', onClick, true);
    doc.addEventListener('auxclick', onClick, true);
    doc.addEventListener('submit', onSubmit, true);
    doc.addEventListener('mouseover', onOver);
    doc.addEventListener('mouseleave', onLeave);
    win.addEventListener('scroll', onScrollEvt, { passive: true });
    cleanup.current = () => {
      doc.removeEventListener('toggle', onToggle, true);
      doc.removeEventListener('click', onClick, true);
      doc.removeEventListener('auxclick', onClick, true);
      doc.removeEventListener('submit', onSubmit, true);
      doc.removeEventListener('mouseover', onOver);
      doc.removeEventListener('mouseleave', onLeave);
      win.removeEventListener('scroll', onScrollEvt);
      cb.current.onHover?.(null);
    };
  };

  return (
    <iframe
      ref={ref}
      className="page-frame"
      title={title}
      sandbox="allow-same-origin"
      referrerPolicy="no-referrer"
      srcDoc={srcDoc}
      onLoad={handleLoad}
    />
  );
}

