import 'reflect-metadata';
import { join } from 'node:path';
import { KnexORM } from '@adapters/connection/knex-orm';
import { Entity, PrimaryKey, Column } from '@core/decorators';

/**
 * Integration test for Module 8 — Node Vanilla.
 * Validates KnexORM.initialize → getRepository → find → close flow with real SQLite.
 */
@Entity('users')
class User {
  @PrimaryKey()
  id!: number;
  @Column({ type: 'string' })
  name!: string;
  @Column({ type: 'boolean' })
  active!: boolean;
}

describe('Node Vanilla integration (Module 8)', () => {
  afterEach(async () => {
    const orm = KnexORM.getInstance();
    if (orm) await orm.close();
  });

  it('should run full flow: initialize → getRepository → find → close', async () => {
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
    await knex.schema.createTable('users', (t) => {
      t.increments('id').primary();
      t.string('name');
      t.boolean('active');
    });

    const userRepo = orm.getRepository(User);
    await userRepo.create({ name: 'Alice', active: true });
    await userRepo.create({ name: 'Bob', active: false });

    const users = await userRepo.find({ where: { active: true } });
    expect(users).toHaveLength(1);
    expect(users[0].name).toBe('Alice');
    expect(users[0].active).toBeTruthy();

    await orm.close();
    expect(KnexORM.getInstance()).toBeNull();
  });

  it('should support initializeFromPath for orm.config.js', async () => {
    const orm = await KnexORM.initializeFromPath(
      join(__dirname, '../../fixtures/connection/config-flat.js'),
    );
    expect(orm).toBeDefined();
    expect(orm.getConnection()).toBeDefined();
    await orm.close();
  });
});
