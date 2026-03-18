import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import {
  detectProjectStructure,
  resolveProjectContextForMigrateGenerate,
} from '../../../src/cli/project-introspection';
import { EntitiesPathNotFoundError, MigrationsDirNotFoundError } from '../../../src/cli/resolve-paths';

describe('project-introspection', () => {
  let cwd: string;

  beforeEach(() => {
    cwd = mkdtempSync(join(tmpdir(), 'knex-orm-introspect-'));
    writeFileSync(join(cwd, 'package.json'), JSON.stringify({ name: 'tmp-project' }), 'utf-8');
  });

  afterEach(() => {
    rmSync(cwd, { recursive: true, force: true });
  });

  it('detectProjectStructure should find root and basic dirs', async () => {
    const srcDir = join(cwd, 'src');
    const distDir = join(cwd, 'dist');
    mkdirSync(srcDir, { recursive: true });
    mkdirSync(distDir, { recursive: true });

    const ctx = await detectProjectStructure(cwd);

    expect(ctx.paths.rootDir).toBe(cwd);
    expect(ctx.paths.srcDir).toBe(srcDir);
    expect(ctx.paths.distDir).toBe(distDir);
    expect(ctx.paths.configFiles.packageJson).toBe(join(cwd, 'package.json'));
  });

  it('resolveProjectContextForMigrateGenerate should resolve entities and migrations with conventions', async () => {
    const entitiesAbs = resolve(cwd, './dist/entities');
    const migrationsAbs = resolve(cwd, './migrations');
    mkdirSync(entitiesAbs, { recursive: true });
    mkdirSync(migrationsAbs, { recursive: true });

    const ctx = await resolveProjectContextForMigrateGenerate({}, cwd);

    expect(ctx.entitiesPath).toBe(entitiesAbs);
    expect(ctx.migrationsDir).toBe(migrationsAbs);
    expect(ctx.paths.entitiesDir).toBe(resolve(entitiesAbs, '..'));
    expect(ctx.paths.migrationsDir).toBe(migrationsAbs);
  });

  it('resolveProjectContextForMigrateGenerate should propagate not-found errors', async () => {
    await expect(resolveProjectContextForMigrateGenerate({}, cwd)).rejects.toBeInstanceOf(EntitiesPathNotFoundError);

    const entitiesAbs = resolve(cwd, './dist/entities');
    mkdirSync(entitiesAbs, { recursive: true });

    await expect(resolveProjectContextForMigrateGenerate({}, cwd)).rejects.toBeInstanceOf(MigrationsDirNotFoundError);
  });
});
