import type { Knex } from 'knex';
import { KnexAdapter } from '@adapters/knex/knex-adapter';

describe('KnexAdapter', () => {
  it('should wrap knex instance and implement IConnection', () => {
    const mockKnex = {} as Knex;
    const adapter = new KnexAdapter(mockKnex);

    expect(adapter.knex).toBe(mockKnex);
  });
});
