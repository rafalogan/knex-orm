import type { Knex } from 'knex';

/**
 * Port for database connection. Abstracts Knex instance access.
 */
export interface IConnection {
  readonly knex: Knex;
}
