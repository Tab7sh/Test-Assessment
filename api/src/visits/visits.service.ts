import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PeopleService } from '../people/people.service';
import { SitesService } from '../sites/sites.service';
import { RecordVisitDto } from './record-visit.dto';
import { Visit } from './visit.schema';

export interface HistoryItem {
  id: string;
  address: string;
  title: string | null;
  revision: number | null;
  found: boolean;
  via: string;
  from: string | null;
  at: Date;
}

@Injectable()
export class VisitsService {
  constructor(
    @InjectModel(Visit.name) private readonly visits: Model<Visit>,
    private readonly people: PeopleService,
    private readonly sites: SitesService,
  ) {}

  /**
   * The browser says where it is and how it got there; the server decides what that address
   * actually held. "found" and "title" are never taken on trust from the client.
   */
  async record(dto: RecordVisitDto, at = new Date()): Promise<HistoryItem> {
    await this.people.get(dto.personId);
    const address = this.sites.address(dto.address);
    const rev = dto.revision === null ? null : await this.sites.findRevision(address, dto.revision ?? null);
    const fields = {
      personId: dto.personId,
      address,
      revision: rev?.n ?? null,
      title: rev?.title ?? null,
      found: !!rev,
      via: dto.via,
      from: dto.from ?? null,
      at,
    };
    const doc = dto.clientId
      ? await this.visits.findOneAndUpdate(
          { personId: dto.personId, clientId: dto.clientId },
          { $setOnInsert: { ...fields, clientId: dto.clientId } },
          { upsert: true, new: true },
        )
      : await this.visits.create(fields);
    if (!doc) throw new Error('Visit was not saved');
    return toItem(doc.toObject());
  }

  /** Newest first, keyset-paginated so a long history scrolls without skipping or repeating. */
  async history(personId: string, before?: string, limit = 50) {
    await this.people.get(personId);
    const size = Math.min(Math.max(limit, 1), 200);
    const filter: Record<string, unknown> = { personId };
    if (before) {
      const { at, id } = decodeCursor(before);
      filter.$or = [{ at: { $lt: at } }, { at, _id: { $lt: id } }];
    }
    const docs = await this.visits
      .find(filter)
      .sort({ at: -1, _id: -1 })
      .limit(size + 1)
      .lean();
    const page = docs.slice(0, size);
    const last = page[page.length - 1];
    return {
      personId,
      items: page.map(toItem),
      next: docs.length > size && last ? encodeCursor(last.at, last._id) : null,
    };
  }
}

function toItem(v: Visit & { _id: Types.ObjectId }): HistoryItem {
  return {
    id: v._id.toHexString(),
    address: v.address,
    title: v.title,
    revision: v.revision,
    found: v.found,
    via: v.via,
    from: v.from,
    at: v.at,
  };
}

function encodeCursor(at: Date, id: Types.ObjectId): string {
  return Buffer.from(`${at.toISOString()}|${id.toHexString()}`).toString('base64url');
}

function decodeCursor(cursor: string): { at: Date; id: Types.ObjectId } {
  try {
    const [iso, hex] = Buffer.from(cursor, 'base64url').toString().split('|');
    const at = new Date(iso);
    if (Number.isNaN(at.getTime()) || !Types.ObjectId.isValid(hex)) throw new Error();
    return { at, id: new Types.ObjectId(hex) };
  } catch {
    throw new BadRequestException('Bad history cursor');
  }
}

