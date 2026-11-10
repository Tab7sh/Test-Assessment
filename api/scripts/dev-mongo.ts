/**
 * Fallback for machines without Docker: runs a real mongod (downloaded once by
 * mongodb-memory-server) on 127.0.0.1:27017, persisting to api/.mongo-data.
 */
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { MongoMemoryServer } from 'mongodb-memory-server';

async function main() {
  const dbPath = join(__dirname, '..', '.mongo-data');
  mkdirSync(dbPath, { recursive: true });
  const server = await MongoMemoryServer.create({
    instance: { port: 27017, ip: '127.0.0.1', dbPath, storageEngine: 'wiredTiger' },
  });
  console.log(`mongod running at ${server.getUri()} (data in ${dbPath}). Ctrl+C to stop.`);
  const stop = async () => {
    await server.stop({ doCleanup: false });
    process.exit(0);
  };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
}

void main();

