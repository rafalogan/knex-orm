import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { EntitiesPathNotFoundError, MigrationsDirNotFoundError, resolvePaths } from '../../../src/cli/resolve-paths';

describe('resolvePaths', () => {
  let cwd: string;

  beforeEach(() => {
    cwd = mkdtempSync(join(tmpdir(), 'knex-orm-resolve-'));
  });

  afterEach(() => {
    rmSync(cwd, { recursive: true, force: true });
  });

  it('should prefer CLI flags over config and conventions', async () => {
    const entitiesRel = './custom/entities';
    const migrationsRel = './custom/migrations';
    const entitiesAbs = resolve(cwd, entitiesRel);
    const migrationsAbs = resolve(cwd, migrationsRel);

    mkdirSync(entitiesAbs, { recursive: true });
    mkdirSync(migrationsAbs, { recursive: true });

    const result = await resolvePaths({ entities: entitiesRel, migrationsDir: migrationsRel }, cwd);

    expect(result.entitiesPath).toBe(entitiesAbs);
    expect(result.migrationsDir).toBe(migrationsAbs);
  });

  it('should read entitiesDir and migrationsDir from knexfile.js when present', async () => {
    const entitiesRel = './dist/entities';
    const migrationsRel = './migrations';
    const entitiesAbs = resolve(cwd, entitiesRel);
    const migrationsAbs = resolve(cwd, migrationsRel);

    mkdirSync(entitiesAbs, { recursive: true });
    mkdirSync(migrationsAbs, { recursive: true });

    const knexfilePath = join(cwd, 'knexfile.js');
    writeFileSync(
      knexfilePath,
      `
      module.exports = {
        entitiesDir: '${entitiesRel}',
        migrationsDir: '${migrationsRel}',
      };
      `,
      'utf-8',
    );

    const result = await resolvePaths({}, cwd);

    expect(result.entitiesPath).toBe(entitiesAbs);
    expect(result.migrationsDir).toBe(migrationsAbs);
  });

  it('should fall back to conventional entities and migrations directories when no config', async () => {
    const entitiesAbs = resolve(cwd, './dist/entities');
    const migrationsAbs = resolve(cwd, './migrations');

    mkdirSync(entitiesAbs, { recursive: true });
    mkdirSync(migrationsAbs, { recursive: true });

    const result = await resolvePaths({}, cwd);

    expect(result.entitiesPath).toBe(entitiesAbs);
    expect(result.migrationsDir).toBe(migrationsAbs);
  });

  it('should throw EntitiesPathNotFoundError when no entities directory exists', async () => {
    const migrationsAbs = resolve(cwd, './migrations');
    mkdirSync(migrationsAbs, { recursive: true });

    await expect(resolvePaths({}, cwd)).rejects.toBeInstanceOf(EntitiesPathNotFoundError);
  });

  it('should throw MigrationsDirNotFoundError when no migrations directory exists', async () => {
    const entitiesAbs = resolve(cwd, './dist/entities');
    mkdirSync(entitiesAbs, { recursive: true });

    await expect(resolvePaths({}, cwd)).rejects.toBeInstanceOf(MigrationsDirNotFoundError);
  });
});
