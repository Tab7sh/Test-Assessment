import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  PayloadTooLargeException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { isAddress, normalizeAddress } from '../common/address';
import { PeopleService } from '../people/people.service';
import { PublishDto } from './publish.dto';
import { cleanPage, MAX_HTML_BYTES } from './sanitize';
import { Revision, Site } from './site.schema';

export interface PageView {
  address: string;
  revision: number;
  latest: number;
  title: string;
  html: string;
  authorId: string;
  authorName: string;
  publishedAt: Date;
}

export interface SearchHit {
  address: string;
  title: string;
  authorName: string;
  snippet: string;
  score: number;
}

@Injectable()
export class SitesService {
  constructor(
    @InjectModel(Site.name) private readonly sites: Model<Site>,
    @InjectModel(Revision.name) private readonly revisions: Model<Revision>,
    private readonly people: PeopleService,
  ) {}

  /** Throws 400 for something that can never be an address; returns the normal form otherwise. */
  address(input: string): string {
    const address = normalizeAddress(input ?? '');
    if (!isAddress(address)) {
      throw new BadRequestException(`"${input}" is not an address. Addresses look like tidepool.zz`);
    }
    return address;
  }

  async directory() {
    const sites = await this.sites
      .find({}, { address: 1, title: 1, authorId: 1, revision: 1, updatedAt: 1 })
      .sort({ address: 1 })
      .lean();
    const names = await this.people.names(sites.map((s) => s.authorId));
    return sites.map((s) => ({
      address: s.address,
      title: s.title,
      authorId: s.authorId,
      authorName: names.get(s.authorId) ?? s.authorId,
      revision: s.revision,
      updatedAt: s.updatedAt,
    }));
  }

  async current(input: string): Promise<PageView> {
    const address = this.address(input);
    const site = await this.sites.findOne({ address }, { revision: 1 }).lean();
    if (!site) throw new NotFoundException(`Nothing has ever been published at ${address}`);
    return this.view(address, site.revision, site.revision);
  }

  async atRevision(input: string, n: number): Promise<PageView> {
    const address = this.address(input);
    const site = await this.sites.findOne({ address }, { revision: 1 }).lean();
    if (!site) throw new NotFoundException(`Nothing has ever been published at ${address}`);
    return this.view(address, n, site.revision);
  }

  /** Lookup used by visit recording: does this revision exist, and what was it called? */
  async findRevision(address: string, n: number | null) {
    const site = await this.sites.findOne({ address }, { revision: 1 }).lean();
    if (!site) return null;
    const rev = await this.revisions
      .findOne({ address, n: n ?? site.revision }, { n: 1, title: 1 })
      .lean();
    return rev ? { n: rev.n, title: rev.title } : null;
  }

  private async view(address: string, n: number, latest: number): Promise<PageView> {
    const rev = await this.revisions.findOne({ address, n }).lean();
    if (!rev) throw new NotFoundException(`${address} has no revision ${n}`);
    const names = await this.people.names([rev.authorId]);
    return {
      address,
      revision: rev.n,
      latest,
      title: rev.title,
      html: rev.html,
      authorId: rev.authorId,
      authorName: names.get(rev.authorId) ?? rev.authorId,
      publishedAt: rev.createdAt,
    };
  }

  /**
   * Publish a page at an address. A new address creates a site; publishing again at your own
   * address appends a revision. An address belongs to whoever published there first.
   */
  async publish(dto: PublishDto, now = new Date()): Promise<PageView> {
    const address = this.address(dto.address);
    if (Buffer.byteLength(dto.html, 'utf8') > MAX_HTML_BYTES) {
      throw new PayloadTooLargeException(`A page can be at most ${MAX_HTML_BYTES / 1000} kB of HTML`);
    }
    const author = await this.people.get(dto.authorId).catch(() => {
      throw new BadRequestException(`Unknown publisher "${dto.authorId}"`);
    });

    const clean = cleanPage(dto.html);
    if (!clean.text && !/<(hr|table|style)/i.test(clean.html)) {
      throw new BadRequestException('That page is empty once scripts and unsupported tags are removed');
    }
    const title = (dto.title?.trim() || clean.title || address).slice(0, 120);

    const existing = await this.sites.findOne({ address }).lean();
    if (existing && existing.authorId !== author._id) {
      const owner = (await this.people.names([existing.authorId])).get(existing.authorId);
      throw new ConflictException(`${address} already belongs to ${owner ?? existing.authorId}`);
    }
    const n = existing ? existing.revision + 1 : 1;

    try {
      await this.revisions.create({
        address,
        n,
        authorId: author._id,
        title,
        rawHtml: dto.html,
        html: clean.html,
        text: clean.text,
        links: clean.links,
        createdAt: now,
      });
    } catch (err) {
      if (isDuplicateKey(err)) {
        throw new ConflictException(`Someone published at ${address} at the same moment — try again`);
      }
      throw err;
    }

    const fields = { title, text: clean.text, revision: n, authorId: author._id };
    if (existing) {
      // Only move forward from the revision we read; a concurrent publish loses cleanly.
      await this.sites.updateOne({ address, revision: existing.revision }, { $set: fields });
    } else {
      try {
        await this.sites.create({ address, ...fields });
      } catch (err) {
        if (isDuplicateKey(err)) throw new ConflictException(`${address} was just taken`);
        throw err;
      }
    }
    return this.view(address, n, n);
  }

  /** Full-text search over what every current page says, ranked by Mongo's text score. */
  async search(q: string, limit = 25): Promise<{ q: string; terms: string[]; results: SearchHit[] }> {
    const query = (q ?? '').trim().slice(0, 200);
    const terms = searchTerms(query);
    if (!query || terms.length === 0) return { q: query, terms, results: [] };

    const docs = await this.sites
      .find(
        { $text: { $search: query } },
        { score: { $meta: 'textScore' }, address: 1, title: 1, text: 1, authorId: 1 },
      )
      .sort({ score: { $meta: 'textScore' } })
      .limit(Math.min(Math.max(limit, 1), 50))
      .lean();
    const names = await this.people.names(docs.map((d) => d.authorId));

    return {
      q: query,
      terms,
      results: docs.map((d) => ({
        address: d.address,
        title: d.title,
        authorName: names.get(d.authorId) ?? d.authorId,
        snippet: snippet(d.text, terms),
        score: Math.round(((d as unknown as { score: number }).score ?? 0) * 100) / 100,
      })),
    };
  }
}

function isDuplicateKey(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: number }).code === 11000;
}

/** Rough stems, good enough to find where in the prose a match happened. */
export function searchTerms(q: string): string[] {
  const words = q.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
  const stems = words
    .filter((w) => w.length > 1)
    .map((w) => (w.length > 4 ? w.replace(/(ing|ed|es|s)$/, '') : w));
  return [...new Set(stems)];
}

function snippet(text: string, terms: string[], width = 220): string {
  const lower = text.toLowerCase();
  let at = -1;
  for (const t of terms) {
    const re = new RegExp(`(^|[^\\p{L}\\p{N}])${escapeRe(t)}`, 'u');
    const m = re.exec(lower);
    if (m && (at === -1 || m.index < at)) at = m.index + m[1].length;
  }
  if (at === -1) return text.slice(0, width) + (text.length > width ? '…' : '');
  let start = Math.max(0, at - 70);
  if (start > 0) {
    const space = text.indexOf(' ', start);
    start = space > -1 && space < at ? space + 1 : start;
  }
  const end = Math.min(text.length, start + width);
  return (start > 0 ? '…' : '') + text.slice(start, end).trim() + (end < text.length ? '…' : '');
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

