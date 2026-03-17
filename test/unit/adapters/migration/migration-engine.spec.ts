import 'reflect-metadata';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { Entity, PrimaryKey, Column } from '@core/decorators';
import { MigrationEngine } from '@adapters/migration/migration-engine';

@Entity('users')
class User {
  @PrimaryKey()
  id!: number;

  @Column({ type: 'string' })
  email!: string;
}

@Entity('posts')
class Post {
  @PrimaryKey()
  id!: number;

  @Column({ type: 'string' })
  title!: string;
}

describe('MigrationEngine', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'migration-engine-'));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('should generate migration on first run', async () => {
    const engine = new MigrationEngine();
    const result = await engine.generate({
      entities: [User, Post],
      migrationsDir: tmpDir,
      schemaPath: join(tmpDir, '.orm-schema.json'),
    });

    expect(result.migrationPath).not.toBeNull();
    expect(result.opsCount).toBe(2);
    expect(result.schemaUpdated).toBe(true);

    const content = await readFile(result.migrationPath!, 'utf-8');
    expect(content).toContain("createTable('users'");
    expect(content).toContain("createTable('posts'");
  });

  it('should return null when no changes', async () => {
    const engine = new MigrationEngine();
    const schemaPath = join(tmpDir, '.orm-schema.json');

    await engine.generate({
      entities: [User],
      migrationsDir: tmpDir,
      schemaPath,
    });

    const result = await engine.generate({
      entities: [User],
      migrationsDir: tmpDir,
      schemaPath,
    });

    expect(result.migrationPath).toBeNull();
    expect(result.opsCount).toBe(0);
    expect(result.schemaUpdated).toBe(false);
  });

  it('should generate addColumn migration when entity gains column', async () => {
    const engine = new MigrationEngine();
    const schemaPath = join(tmpDir, '.orm-schema.json');

    await engine.generate({
      entities: [User],
      migrationsDir: tmpDir,
      schemaPath,
    });

    @Entity('users')
    class UserWithName {
      @PrimaryKey()
      id!: number;

      @Column({ type: 'string' })
      email!: string;

      @Column({ type: 'string' })
      name!: string;
    }

    const result = await engine.generate({
      entities: [UserWithName],
      migrationsDir: tmpDir,
      schemaPath,
    });

    expect(result.opsCount).toBe(1);
    const content = await readFile(result.migrationPath!, 'utf-8');
    expect(content).toContain("alterTable('users'");
    expect(content).toContain("table.string('name'");
  });
});
