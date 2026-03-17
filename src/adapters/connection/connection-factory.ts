import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import type { Knex } from 'knex';
import type { ConnectionEntry } from './connection-config';

/**
 * Creates Knex instances from connection config.
 */
export class ConnectionFactory {
  create(entry: ConnectionEntry): Knex {
    const req = createRequire(resolve(process.cwd(), 'package.json'));
    const knexFactory = req('knex') as (config: Knex.Config) => Knex;
    const config: Knex.Config = {
      client: entry.client,
      connection: entry.connection,
    };
    if (entry.pool) config.pool = entry.pool;
    if (entry.migrations) config.migrations = entry.migrations;
    return knexFactory(config);
  }
}
