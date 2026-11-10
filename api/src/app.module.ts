import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PeopleModule } from './people/people.module';
import { SitesModule } from './sites/sites.module';
import { VisitsModule } from './visits/visits.module';

export const MONGO_URL = process.env.MONGO_URL ?? 'mongodb://127.0.0.1:27017/smallweb';

@Module({
  imports: [MongooseModule.forRoot(MONGO_URL), PeopleModule, SitesModule, VisitsModule],
})
export class AppModule {}

