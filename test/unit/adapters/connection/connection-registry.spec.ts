import type { Knex } from 'knex';
import { ConnectionRegistry } from '@adapters/connection/connection-registry';

describe('ConnectionRegistry', () => {
  let registry: ConnectionRegistry;
  const mockKnex = {} as Knex;

  beforeEach(() => {
    registry = new ConnectionRegistry();
  });

  it('should register and get connection by name', () => {
    registry.register('primary', mockKnex);

    expect(registry.get('primary')).toBe(mockKnex);
  });

  it('should return undefined for unknown connection', () => {
    expect(registry.get('unknown')).toBeUndefined();
  });

  it('should list registered connection names', () => {
    registry.register('primary', mockKnex);
    registry.register('secondary', {} as Knex);

    const names = registry.list();

    expect(names).toContain('primary');
    expect(names).toContain('secondary');
    expect(names).toHaveLength(2);
  });

  it('should allow overwriting connection', () => {
    const knex2 = {} as Knex;
    registry.register('primary', mockKnex);
    registry.register('primary', knex2);

    expect(registry.get('primary')).toBe(knex2);
  });
});
