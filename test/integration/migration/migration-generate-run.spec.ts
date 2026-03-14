/**
 * Integration test: MigrationGenerator — generate migration and run with SQLite.
 * Module 9 — MigrationGenerator integration.
 */
import 'reflect-metadata';
import { join } from 'node:path';
import { mkdtempSync, rmSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import knex, { type Knex } from 'knex';
import { Entity, PrimaryKey, Column } from '@core/decorators';
import { MigrationEngine } from '@adapters/migration/migration-engine';

@Entity('items')
class Item {
  @PrimaryKey()
  id!: number;
  @Column({ type: 'string' })
  title!: string;
}

describe('Migration generate and run integration', () => {
  let tempDir: string;
  let db: Knex;

  beforeAll(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'knex-orm-mig-'));
  });

  afterAll(() => {
    if (db) db.destroy();
    if (tempDir && existsSync(tempDir)) rmSync(tempDir, { recursive: true });
  });

  it('should generate migration and run up', async () => {
    const migrationsDir = join(tempDir, 'migrations');
    const schemaPath = join(tempDir, '.orm-schema.json');

    const engine = new MigrationEngine();
    const result = await engine.generate({
      entities: [Item],
      migrationsDir,
      schemaPath,
      migrationName: 'create_items',
    });

    expect(result.migrationPath).toBeTruthy();
    expect(result.opsCount).toBe(1);
    expect(result.schemaUpdated).toBe(true);

    const content = readFileSync(result.migrationPath!, 'utf-8');
    expect(content).toContain("createTable('items'");
    expect(content).toContain('increments');
    expect(content).toContain('string');

    db = knex({
      client: 'sqlite3',
      connection: { filename: ':memory:' },
      useNullAsDefault: true,
      migrations: { directory: migrationsDir },
    });

    await db.migrate.latest();
    const hasTable = await db.schema.hasTable('items');
    expect(hasTable).toBe(true);

    await db('items').insert({ title: 'test' });
    const rows = await db('items').select('*');
    expect(rows).toHaveLength(1);
    expect(rows[0].title).toBe('test');
  });
});
