/**
 * Integration test: Migration rollback.
 * Generate migration, run up, then rollback.
 */
import 'reflect-metadata';
import { join } from 'node:path';
import { mkdtempSync, rmSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import knex, { type Knex } from 'knex';
import { Entity, PrimaryKey, Column } from '@core/decorators';
import { MigrationEngine } from '@adapters/migration/migration-engine';

@Entity('rollback_test')
class RollbackTest {
  @PrimaryKey()
  id!: number;
  @Column({ type: 'string' })
  value!: string;
}

describe('Migration rollback integration', () => {
  let tempDir: string;
  let db: Knex;

  beforeAll(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'knex-orm-rollback-'));
  });

  afterAll(() => {
    if (db) db.destroy();
    if (tempDir && existsSync(tempDir)) rmSync(tempDir, { recursive: true });
  });

  it('should rollback migration after running up', async () => {
    const migrationsDir = join(tempDir, 'migrations');
    const schemaPath = join(tempDir, '.orm-schema.json');

    const engine = new MigrationEngine();
    const result = await engine.generate({
      entities: [RollbackTest],
      migrationsDir,
      schemaPath,
      migrationName: 'create_rollback_test',
    });

    expect(result.migrationPath).toBeTruthy();
    expect(result.opsCount).toBe(1);

    const content = readFileSync(result.migrationPath!, 'utf-8');
    expect(content).toContain("createTable('rollback_test'");
    expect(content).toContain('dropTableIfExists');

    db = knex({
      client: 'sqlite3',
      connection: { filename: ':memory:' },
      useNullAsDefault: true,
      migrations: { directory: migrationsDir },
    });

    await db.migrate.latest();
    let hasTable = await db.schema.hasTable('rollback_test');
    expect(hasTable).toBe(true);

    await db.migrate.rollback();
    hasTable = await db.schema.hasTable('rollback_test');
    expect(hasTable).toBe(false);
  });

  it('should allow run up again after rollback', async () => {
    const migrationsDir = join(tempDir, 'migrations2');
    const schemaPath = join(tempDir, '.orm-schema2.json');

    const engine = new MigrationEngine();
    await engine.generate({
      entities: [RollbackTest],
      migrationsDir,
      schemaPath,
      migrationName: 'first',
    });

    db = knex({
      client: 'sqlite3',
      connection: { filename: ':memory:' },
      useNullAsDefault: true,
      migrations: { directory: migrationsDir },
    });

    await db.migrate.latest();
    const hasTableAfterUp = await db.schema.hasTable('rollback_test');
    expect(hasTableAfterUp).toBe(true);

    await db.migrate.rollback();
    const hasTableAfterRollback = await db.schema.hasTable('rollback_test');
    expect(hasTableAfterRollback).toBe(false);

    await db.migrate.latest();
    const hasTableAfterReUp = await db.schema.hasTable('rollback_test');
    expect(hasTableAfterReUp).toBe(true);
  });
});
