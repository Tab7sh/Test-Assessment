import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Person } from './person.schema';

@Injectable()
export class PeopleService {
  constructor(@InjectModel(Person.name) private readonly people: Model<Person>) {}

  list() {
    return this.people.find().sort({ name: 1 }).lean();
  }

  async get(id: string) {
    const person = await this.people.findById(id).lean();
    if (!person) throw new NotFoundException(`Nobody called "${id}" is on this web`);
    return person;
  }

  async names(ids: string[]): Promise<Map<string, string>> {
    const found = await this.people.find({ _id: { $in: [...new Set(ids)] } }).lean();
    return new Map(found.map((p) => [p._id, p.name]));
  }
}

