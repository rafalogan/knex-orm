import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { SchemaRegistry } from '@adapters/migration/storage/schema-registry';
import type { OrmSchema } from '@adapters/migration/schema/schema-types';

describe('SchemaRegistry', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'orm-schema-'));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('should return null when schema file does not exist', async () => {
    const registry = new SchemaRegistry(join(tmpDir, 'nonexistent.json'));
    const result = await registry.load();
    expect(result).toBeNull();
  });

  it('should load schema from file', async () => {
    const path = join(tmpDir, '.orm-schema.json');
    const schema: OrmSchema = {
      version: 1,
      tables: {
        users: {
          tableName: 'users',
          columns: { id: { columnName: 'id', type: 'integer' } },
          primaryKey: { columnName: 'id', autoincrement: true },
        },
      },
    };
    await writeFile(path, JSON.stringify(schema), 'utf-8');

    const registry = new SchemaRegistry(path);
    const loaded = await registry.load();
    expect(loaded).not.toBeNull();
    expect(loaded?.tables['users']).toBeDefined();
    expect(loaded?.tables['users'].tableName).toBe('users');
  });

  it('should save schema to file', async () => {
    const path = join(tmpDir, 'output', '.orm-schema.json');
    const schema: OrmSchema = {
      version: 1,
      tables: {
        users: {
          tableName: 'users',
          columns: { id: { columnName: 'id', type: 'integer' } },
          primaryKey: { columnName: 'id', autoincrement: true },
        },
      },
    };

    const registry = new SchemaRegistry(path);
    await registry.save(schema);

    const content = await readFile(path, 'utf-8');
    const parsed = JSON.parse(content) as OrmSchema;
    expect(parsed.tables['users']).toBeDefined();
    expect(parsed.generatedAt).toBeDefined();
  });

  it('should return null for invalid JSON', async () => {
    const path = join(tmpDir, 'invalid.json');
    await writeFile(path, 'not valid json', 'utf-8');

    const registry = new SchemaRegistry(path);
    const result = await registry.load();
    expect(result).toBeNull();
  });
});
