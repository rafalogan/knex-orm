/**
 * Integration test: Multi-connection support.
 * KnexORM with multiple named connections.
 */
import 'reflect-metadata';
import { KnexORM } from '@adapters/connection/knex-orm';
import { Entity, PrimaryKey, Column } from '@core/decorators';

@Entity('primary_items')
class PrimaryItem {
  @PrimaryKey()
  id!: number;
  @Column({ type: 'string' })
  name!: string;
}

describe('Multi-connection integration', () => {
  afterEach(async () => {
    const orm = KnexORM.getInstance();
    if (orm) await orm.close();
  });

  it('should support multiple named connections', async () => {
    const orm = await KnexORM.initialize({
      default: 'primary',
      connections: {
        primary: {
          client: 'sqlite3',
          connection: { filename: ':memory:' },
          useNullAsDefault: true,
        },
        secondary: {
          client: 'sqlite3',
          connection: { filename: ':memory:' },
          useNullAsDefault: true,
        },
      },
    });

    const primaryKnex = orm.getConnection('primary');
    const secondaryKnex = orm.getConnection('secondary');

    expect(primaryKnex).toBeDefined();
    expect(secondaryKnex).toBeDefined();
    expect(primaryKnex).not.toBe(secondaryKnex);

    await primaryKnex.schema.createTable('primary_items', (t) => {
      t.increments('id').primary();
      t.string('name');
    });
    await secondaryKnex.schema.createTable('secondary_items', (t) => {
      t.increments('id').primary();
      t.string('label');
    });

    await primaryKnex('primary_items').insert({ name: 'primary-data' });
    await secondaryKnex('secondary_items').insert({ label: 'secondary-data' });

    const primaryRows = await primaryKnex('primary_items').select('*');
    const secondaryRows = await secondaryKnex('secondary_items').select('*');

    expect(primaryRows).toHaveLength(1);
    expect(secondaryRows).toHaveLength(1);
    expect(primaryRows[0].name).toBe('primary-data');
    expect(secondaryRows[0].label).toBe('secondary-data');

    await orm.close();
  });

  it('should use default connection when name omitted', async () => {
    const orm = await KnexORM.initialize({
      default: 'main',
      connections: {
        main: {
          client: 'sqlite3',
          connection: { filename: ':memory:' },
          useNullAsDefault: true,
        },
      },
    });

    const defaultConn = orm.getConnection();
    const mainConn = orm.getConnection('main');

    expect(defaultConn).toBe(mainConn);

    await orm.close();
  });

  it('should getRepository use default connection', async () => {
    const orm = await KnexORM.initialize({
      default: 'primary',
      connections: {
        primary: {
          client: 'sqlite3',
          connection: { filename: ':memory:' },
          useNullAsDefault: true,
        },
      },
    });

    const knex = orm.getConnection();
    await knex.schema.createTable('primary_items', (t) => {
      t.increments('id').primary();
      t.string('name');
    });

    const repo = orm.getRepository(PrimaryItem);
    const created = await repo.create({ name: 'test' });

    expect(created.id).toBeDefined();
    expect(created.name).toBe('test');

    const found = await repo.findById(created.id!);
    expect(found?.name).toBe('test');

    await orm.close();
  });
});
