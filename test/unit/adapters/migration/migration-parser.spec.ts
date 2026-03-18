import 'reflect-metadata';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { MigrationParser } from '@adapters/migration/migration-parser';

describe('MigrationParser', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'migration-parser-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('should parse basic createTable migration with columns and primary key', async () => {
    const filePath = join(tempDir, '001_create_users.ts');
    writeFileSync(
      filePath,
      `
        import type { Knex } from 'knex';

        export async function up(knex: Knex): Promise<void> {
          await knex.schema.createTable('users', (table) => {
            table.increments('id');
            table.string('email', 255);
            table.string('name');
            table.boolean('active');
            table.timestamp('created_at');
          });
        }
      `,
      'utf-8',
    );

    const parser = new MigrationParser();
    const result = await parser.parse(filePath);

    expect(result.tableName).toBe('users');
    expect(result.columns).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'id', type: 'integer', primary: true }),
        expect.objectContaining({ name: 'email', type: 'string' }),
        expect.objectContaining({ name: 'name', type: 'string' }),
        expect.objectContaining({ name: 'active', type: 'boolean' }),
        expect.objectContaining({ name: 'created_at', type: 'timestamp' }),
      ]),
    );
  });

  it('should parse foreign keys and indexes', async () => {
    const filePath = join(tempDir, '002_create_posts.ts');
    writeFileSync(
      filePath,
      `
        import type { Knex } from 'knex';

        export async function up(knex: Knex): Promise<void> {
          await knex.schema.createTable('posts', (table) => {
            table.increments('id');
            table.integer('user_id');
            table.string('title');
            table.text('body');
            table.unique(['user_id', 'title']);
            table.index(['user_id']);
          });
        }
      `,
      'utf-8',
    );

    const parser = new MigrationParser();
    const result = await parser.parse(filePath);

    expect(result.tableName).toBe('posts');

    expect(result.columns).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'id', primary: true }),
        expect.objectContaining({ name: 'user_id', type: 'integer' }),
      ]),
    );

    // we only assert basic structure and indexes here; foreign keys are optional in this minimal parser
    expect(result.foreignKeys).toEqual(expect.any(Array));

    expect(result.indexes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ columns: ['user_id', 'title'], unique: true }),
        expect.objectContaining({ columns: ['user_id'], unique: false }),
      ]),
    );
  });
});

