import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { MigrationWriter } from '@adapters/migration/migration-writer';

describe('MigrationWriter', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'migration-writer-'));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('should write migration file to disk', async () => {
    const writer = new MigrationWriter(tmpDir);
    const content = "import type { Knex } from 'knex';\nexport async function up(knex: Knex) {}";

    const path = await writer.write('20250311120000_create_users', content);

    expect(path).toContain('20250311120000_create_users.ts');
    const written = await readFile(path, 'utf-8');
    expect(written).toBe(content);
  });

  it('should create nested directory', async () => {
    const writer = new MigrationWriter(join(tmpDir, 'db', 'migrations'));
    const path = await writer.write('20250311120000_test', '// test');

    expect(path).toContain('db/migrations');
    const written = await readFile(path, 'utf-8');
    expect(written).toBe('// test');
  });

  it('should generate filename with timestamp', () => {
    const writer = new MigrationWriter();
    const name = writer.generateFilename('create_users');
    expect(name).toMatch(/^\d{14}_create_users$/);
  });
});
