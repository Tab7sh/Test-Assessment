/**
 * Seed the small web. Idempotent and deterministic:
 *   - people and sites are upserted by their natural keys (slug, address);
 *   - seeded sites are reset to exactly one revision with fixed content and timestamps;
 *   - seeded visits carry a seedKey and are replaced wholesale on every run;
 *   - anything published or browsed live is left alone (use --reset to wipe everything).
 */
import mongoose from 'mongoose';
import { PersonSchema, Person } from '../people/person.schema';
import { cleanPage } from '../sites/sanitize';
import { Revision, RevisionSchema, Site, SiteSchema } from '../sites/site.schema';
import { Visit, VisitSchema } from '../visits/visit.schema';
import { PEOPLE } from './people';
import { SITES } from './sites';
import { generateVisits, SEED_HOUR_START } from './visits';

const MONGO_URL = process.env.MONGO_URL ?? 'mongodb://127.0.0.1:27017/smallweb';

async function main() {
  const reset = process.argv.includes('--reset');
  await mongoose.connect(MONGO_URL, { serverSelectionTimeoutMS: 5000 });
  const People = mongoose.model(Person.name, PersonSchema);
  const Sites = mongoose.model(Site.name, SiteSchema);
  const Revisions = mongoose.model(Revision.name, RevisionSchema);
  const Visits = mongoose.model(Visit.name, VisitSchema);

  if (reset) {
    await mongoose.connection.dropDatabase();
    console.log('dropped database');
  }
  await Promise.all([People.syncIndexes(), Sites.syncIndexes(), Revisions.syncIndexes(), Visits.syncIndexes()]);

  await People.bulkWrite(
    PEOPLE.map((p) => ({ replaceOne: { filter: { _id: p._id }, replacement: { ...p }, upsert: true } })),
  );

  const graph = new Map<string, string[]>();
  const titles = new Map<string, string>();
  // Sites were "published" over the week before the seeded hour, one every few hours.
  const publishedAt = (i: number) => new Date(SEED_HOUR_START.getTime() - (SITES.length - i) * 7 * 3600_000);

  for (const [i, s] of SITES.entries()) {
    const clean = cleanPage(s.html);
    graph.set(s.address, clean.links);
    titles.set(s.address, s.title);
    const at = publishedAt(i);
    await Revisions.deleteMany({ address: s.address, n: { $gt: 1 } });
    await Revisions.replaceOne(
      { address: s.address, n: 1 },
      {
        address: s.address,
        n: 1,
        authorId: s.authorId,
        title: s.title,
        rawHtml: s.html,
        html: clean.html,
        text: clean.text,
        links: clean.links,
        createdAt: at,
      },
      { upsert: true },
    );
    await Sites.replaceOne(
      { address: s.address },
      { address: s.address, authorId: s.authorId, title: s.title, text: clean.text, revision: 1, createdAt: at, updatedAt: at },
      { upsert: true, timestamps: false },
    );
  }

  const visits = generateVisits(graph);
  await Visits.deleteMany({ seedKey: { $exists: true } });
  await Visits.insertMany(
    visits.map((v) => {
      const found = graph.has(v.address);
      return { ...v, found, revision: found ? 1 : null, title: titles.get(v.address) ?? null };
    }),
  );

  const perPerson = new Map<string, { visits: number; sites: Set<string> }>();
  for (const v of visits) {
    const p = perPerson.get(v.personId) ?? { visits: 0, sites: new Set() };
    p.visits++;
    if (graph.has(v.address)) p.sites.add(v.address);
    perPerson.set(v.personId, p);
  }
  const dead = new Set(visits.filter((v) => !graph.has(v.address)).map((v) => v.address));

  console.log(`seeded ${PEOPLE.length} people, ${SITES.length} sites, ${visits.length} visits into ${MONGO_URL}`);
  for (const [id, p] of [...perPerson].sort((a, b) => b[1].visits - a[1].visits)) {
    console.log(`  ${id.padEnd(8)} ${String(p.visits).padStart(3)} visits, ${p.sites.size}/${SITES.length} sites`);
  }
  console.log(`  dead ends visited: ${[...dead].sort().join(', ') || 'none'}`);
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error(err instanceof Error ? err.message : err);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});

