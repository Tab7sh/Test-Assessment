import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

/** Someone who browses, publishes, or both. Identified by a stable slug — no accounts. */
@Schema({ collection: 'people', versionKey: false })
export class Person {
  @Prop({ type: String, required: true })
  _id: string;

  @Prop({ required: true })
  name: string;
}

export type PersonDocument = HydratedDocument<Person>;
export const PersonSchema = SchemaFactory.createForClass(Person);

