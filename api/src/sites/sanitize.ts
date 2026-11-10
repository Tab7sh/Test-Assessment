import sanitizeHtml from 'sanitize-html';
import { isAddress, normalizeAddress } from '../common/address';

/**
 * CONTAINMENT, LAYER 1 OF 2 — what we agree to store.
 *
 * Every published page passes through `cleanPage` before it is stored. The rendered page then
 * lives in a sandboxed, script-less iframe with its own CSP (layer 2, web/components/PageFrame.tsx).
 * Layer 2 is the real boundary: even if something slips past this allow-list, it cannot run,
 * cannot navigate the tab, cannot open windows, and cannot reach the network. This layer exists
 * so stored pages are honest about what they can do, and so search indexes prose, not markup.
 *
 * What it costs authors (deliberately):
 *  - No JavaScript of any kind: <script>, on* handlers, javascript: URLs are all removed.
 *  - No forms, inputs, buttons, iframes, objects, embeds, <base>, <meta>, <link>.
 *  - No images or external assets — this web has nothing to host them and no real network.
 *    CSS `url(...)` and `@import` are neutralised here and blocked by CSP anyway.
 *  - Links may only point at `.zz` addresses or at #fragments in the same page. `target`
 *    is stripped, so a page can never choose where a navigation lands.
 *  - Authors keep: semantic HTML, tables, lists, <details>, inline `style` attributes and
 *    <style> blocks — enough to make a page look like theirs.
 */

export const MAX_HTML_BYTES = 200_000;

const ALLOWED_TAGS = [
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'a', 'ul', 'ol', 'li', 'dl', 'dt', 'dd',
  'blockquote', 'pre', 'code', 'kbd', 'samp', 'var', 'em', 'strong', 'b', 'i', 'u', 's',
  'small', 'sub', 'sup', 'br', 'hr', 'span', 'div', 'section', 'article', 'header',
  'footer', 'nav', 'aside', 'main', 'figure', 'figcaption', 'table', 'caption', 'thead',
  'tbody', 'tfoot', 'tr', 'th', 'td', 'abbr', 'cite', 'q', 'mark', 'del', 'ins', 'time',
  'details', 'summary', 'address', 'center', 'font', 'style',
];

const NON_TEXT_TAGS = [
  'script', 'style', 'textarea', 'option', 'noscript', 'title', 'template', 'iframe',
  'object', 'embed', 'select', 'svg', 'math',
];

const GLOBAL_ATTRS = ['id', 'class', 'style', 'title', 'lang', 'dir', 'align'];

/** Neutralise the parts of CSS that fetch things. CSP is the hard stop; this is hygiene. */
export function cleanCss(css: string): string {
  return css
    .replace(/@import[^;]*;?/gi, '')
    .replace(/url\s*\(/gi, 'blocked(')
    .replace(/image-set\s*\(/gi, 'blocked(')
    .replace(/expression\s*\(/gi, 'blocked(')
    .replace(/-moz-binding|behavior\s*:/gi, 'blocked:');
}

export interface CleanPage {
  html: string;
  text: string;
  links: string[];
  title: string | null;
}

export function cleanPage(raw: string): CleanPage {
  const links = new Set<string>();

  const html = sanitizeHtml(raw, {
    allowedTags: ALLOWED_TAGS,
    // Required to keep <style>. Safe here only because the page never shares a document
    // or a script context with our interface — see PageFrame.tsx.
    allowVulnerableTags: true,
    disallowedTagsMode: 'discard',
    nonTextTags: NON_TEXT_TAGS.filter((t) => t !== 'style'),
    allowedAttributes: {
      '*': GLOBAL_ATTRS,
      a: ['href', 'name', ...GLOBAL_ATTRS],
      td: ['colspan', 'rowspan', ...GLOBAL_ATTRS],
      th: ['colspan', 'rowspan', 'scope', ...GLOBAL_ATTRS],
      ol: ['start', 'reversed', 'type', ...GLOBAL_ATTRS],
      time: ['datetime', ...GLOBAL_ATTRS],
      details: ['open', ...GLOBAL_ATTRS],
      font: ['color', 'face', 'size', ...GLOBAL_ATTRS],
    },
    // No scheme is allowed in an href at all: addresses are scheme-less (`moss.zz`), and
    // fragments are relative. That single rule removes javascript:, data:, http:, mailto: …
    allowedSchemes: [],
    allowedSchemesAppliedToAttributes: ['href'],
    allowProtocolRelative: false,
    transformTags: {
      a: (tagName, attribs) => {
        const out: Record<string, string> = { ...attribs };
        const href = (attribs.href ?? '').trim();
        delete out.href;
        if (href.startsWith('#')) {
          out.href = href;
        } else if (href) {
          const address = normalizeAddress(href);
          if (isAddress(address)) {
            out.href = address;
            links.add(address);
          }
          // Anything else (http:, javascript:, garbage) becomes inert text.
        }
        return { tagName, attribs: out };
      },
    },
  });

  const contained = html
    .replace(/(<style[^>]*>)([\s\S]*?)(<\/style>)/gi, (_m, open, css, close) => open + cleanCss(css) + close)
    .replace(/\sstyle="([^"]*)"/gi, (_m, css) => ` style="${cleanCss(css)}"`);

  return {
    html: contained,
    text: toText(contained),
    links: [...links].sort(),
    title: extractTitle(raw),
  };
}

const BLOCK_BOUNDARY =
  /<\/?(?:p|div|h[1-6]|li|br|tr|td|th|section|article|blockquote|pre|header|footer|nav|aside|main|dt|dd|figcaption|hr|caption|summary|details)\b[^>]*>/gi;

/** Plain prose for search: what a reader would read, not what an author typed. */
export function toText(html: string): string {
  const spaced = html.replace(BLOCK_BOUNDARY, (m) => ` ${m} `);
  const stripped = sanitizeHtml(spaced, {
    allowedTags: [],
    allowedAttributes: {},
    nonTextTags: NON_TEXT_TAGS,
  });
  return decodeEntities(stripped).replace(/\s+/g, ' ').trim();
}

function extractTitle(raw: string): string | null {
  const fromTitle = raw.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  const fromH1 = raw.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1];
  const candidate = fromTitle ?? fromH1;
  if (!candidate) return null;
  const text = toText(candidate);
  return text ? text.slice(0, 120) : null;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&#(\d+);/g, (_m, d) => String.fromCodePoint(Number(d)))
    .replace(/&amp;/g, '&');
}

