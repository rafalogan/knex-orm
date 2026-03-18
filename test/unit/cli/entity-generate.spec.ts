import 'reflect-metadata';
import { mkdtempSync, rmSync, writeFileSync, existsSync, readFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { handleEntityGenerateFromCwd } from '@cli/migrate-generate';

describe('CLI entity:generate', () => {
  let cwd: string;

  beforeEach(() => {
    cwd = mkdtempSync(join(tmpdir(), 'knx-orm-entity-generate-'));
  });

  afterEach(() => {
    rmSync(cwd, { recursive: true, force: true });
  });

  it.skip('should generate entities from detected migrations when run without flags', async () => {
    const migrationsDir = join(cwd, 'migrations');
    const entitiesDir = join(cwd, 'entities');

    // minimal migration file
    const migPath = join(migrationsDir, '001_create_users.ts');
    mkdirSync(migrationsDir, { recursive: true });
    writeFileSync(
      migPath,
      `
        import type { Knex } from 'knex';

        export async function up(knex: Knex): Promise<void> {
          await knex.schema.createTable('users', (table) => {
            table.increments('id').primary();
            table.string('email').notNullable();
          });
        }
      `,
      'utf-8',
    );

    // Simulate default conventions: entitiesDir is ./entities, starting from temp cwd
    await handleEntityGenerateFromCwd(cwd);

    const entityPath = join(entitiesDir, 'User.ts');
    expect(existsSync(entityPath)).toBe(true);

    const content = readFileSync(entityPath, 'utf-8');
    expect(content).toContain("@Entity('users')");
    expect(content).toContain('export class User');
    expect(content).toContain('@PrimaryKey()');
    expect(content).toContain('@Column');
  });
});
