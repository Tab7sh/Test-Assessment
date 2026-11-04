import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

/**
 * A site is an address and a pointer to its current revision. Its title and text are
 * denormalised from that revision so search is a single indexed query.
 */
@Schema({ collection: 'sites', versionKey: false, timestamps: true })
export class Site {
  @Prop({ required: true, unique: true })
  address: string;

  @Prop({ required: true })
  authorId: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true, default: '' })
  text: string;

  /** Current revision number. Revisions are append-only, so this only ever grows. */
  @Prop({ required: true })
  revision: number;

  createdAt?: Date;
  updatedAt?: Date;
}

export type SiteDocument = HydratedDocument<Site>;
export const SiteSchema = SchemaFactory.createForClass(Site);
SiteSchema.index(
  { title: 'text', address: 'text', text: 'text' },
  { name: 'site_search', weights: { title: 10, address: 4, text: 1 }, default_language: 'english' },
);

/**
 * An immutable snapshot of what a site said at one moment. Edits add a revision rather than
 * replacing the page, so "back" can show the page exactly as it was left, and history can say
 * which version someone actually read.
 */
@Schema({ collection: 'revisions', versionKey: false })
export class Revision {
  @Prop({ required: true })
  address: string;

  @Prop({ required: true })
  n: number;

  @Prop({ required: true })
  authorId: string;

  @Prop({ required: true })
  title: string;

  /** Exactly what the author submitted. Never served. */
  @Prop({ required: true })
  rawHtml: string;

  /** The contained page — the only HTML ever sent to a browser. */
  @Prop({ required: true })
  html: string;

  @Prop({ required: true, default: '' })
  text: string;

  /** Outbound addresses, normalised. Useful for the seed and for anyone curious. */
  @Prop({ type: [String], default: [] })
  links: string[];

  @Prop({ required: true })
  createdAt: Date;
}

export type RevisionDocument = HydratedDocument<Revision>;
export const RevisionSchema = SchemaFactory.createForClass(Revision);
RevisionSchema.index({ address: 1, n: 1 }, { unique: true });

