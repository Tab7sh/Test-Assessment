import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

/** How someone arrived. Back/forward/reload are arrivals too — a browser records them. */
export const VIA = [
  'typed',
  'link',
  'search',
  'history',
  'directory',
  'publish',
  'back',
  'forward',
  'reload',
] as const;
export type Via = (typeof VIA)[number];

/**
 * A recorded fact: this person arrived at this address at this time, and got there this way.
 * Visits are append-only; the history a person scrolls through is a query over them.
 */
@Schema({ collection: 'visits', versionKey: false })
export class Visit {
  /** A retry of the same arrival must not create a second visit. */
  @Prop({ type: String })
  clientId?: string;

  @Prop({ required: true })
  personId: string;

  @Prop({ required: true })
  address: string;

  /** Which revision was shown. null when the address led nowhere. */
  @Prop({ type: Number, default: null })
  revision: number | null;

  /** Title as it was at the time of the visit — history should not rewrite itself. */
  @Prop({ type: String, default: null })
  title: string | null;

  @Prop({ required: true })
  found: boolean;

  @Prop({ required: true, enum: VIA })
  via: Via;

  /** Where they were before: an address, or an about: page such as a search. */
  @Prop({ type: String, default: null })
  from: string | null;

  @Prop({ required: true })
  at: Date;

  /** Present only on seeded visits, so seeding can replace exactly what it created. */
  @Prop({ type: String })
  seedKey?: string;
}

export type VisitDocument = HydratedDocument<Visit>;
export const VisitSchema = SchemaFactory.createForClass(Visit);
VisitSchema.index({ personId: 1, at: -1, _id: -1 });
VisitSchema.index({ seedKey: 1 }, { unique: true, sparse: true });
VisitSchema.index({ personId: 1, clientId: 1 }, { unique: true, partialFilterExpression: { clientId: { $type: 'string' } } });

