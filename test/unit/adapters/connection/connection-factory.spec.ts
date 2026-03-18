import type { Knex } from 'knex';
import { ConnectionFactory } from '@adapters/connection/connection-factory';
import type { ConnectionEntry } from '@adapters/connection/connection-config';

describe('ConnectionFactory', () => {
  let factory: ConnectionFactory;

  beforeEach(() => {
    factory = new ConnectionFactory();
  });

  it('should create knex instance from connection config', () => {
    const entry: ConnectionEntry = {
      client: 'sqlite3',
      connection: { filename: ':memory:' },
    };

    const knex = factory.create(entry);

    expect(knex).toBeDefined();
    expect(typeof knex).toBe('function');
    expect((knex as Knex).client?.config?.client).toBe('sqlite3');
  });

  it('should support pool config', () => {
    const entry: ConnectionEntry = {
      client: 'sqlite3',
      connection: { filename: ':memory:' },
      pool: { min: 0, max: 5 },
    };

    const knex = factory.create(entry);
    const config = (knex as Knex).client?.config;

    expect(config?.pool).toEqual({ min: 0, max: 5 });
  });
});
