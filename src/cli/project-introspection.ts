import { existsSync } from 'node:fs';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { resolvePaths, type CliFlags } from './resolve-paths';
import {
  EntitiesPathNotFoundError,
  MigrationsDirNotFoundError,
} from './resolve-paths';

export type ConfigSource = 'none' | 'knexfile' | 'knexConfig' | 'ormConfig' | 'workspace';

export interface ProjectPaths {
  rootDir: string;
  srcDir?: string;
  distDir?: string;
  entitiesDir?: string;
  migrationsDir?: string;
  configFiles: {
    knexfile?: string;
    knexConfig?: string;
    ormConfig?: string;
    packageJson: string;
  };
  isMonorepo: boolean;
}

export interface ProjectContext {
  paths: ProjectPaths;
  configSource: ConfigSource;
}

const CONFIG_CANDIDATES = [
  'knexfile.ts',
  'knexfile.mjs',
  'knexfile.js',
  'knexfile.cjs',
  'knexfile.json',
  'knex.config.ts',
  'knex.config.mjs',
  'knex.config.js',
  'knex.config.cjs',
  'knex.config.json',
] as const;

function findProjectRoot(start: string): string {
  let current = resolve(start);
  // stop when filesystem root is reached
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const pkg = join(current, 'package.json');
    const git = join(current, '.git');
    const rules = join(current, '.rules');
    if (existsSync(pkg) || existsSync(git) || existsSync(rules)) {
      return current;
    }
    const parent = dirname(current);
    if (parent === current) {
      return start;
    }
    current = parent;
  }
}

function detectConfigFiles(rootDir: string): {
  knexfile?: string;
  knexConfig?: string;
  ormConfig?: string;
  source: ConfigSource;
} {
  let knexfile: string | undefined;
  let knexConfig: string | undefined;
  let ormConfig: string | undefined;
  let source: ConfigSource = 'none';

  for (const name of CONFIG_CANDIDATES) {
    const full = join(rootDir, name);
    if (!existsSync(full)) continue;
    if (name.startsWith('knexfile')) {
      knexfile = full;
      source = 'knexfile';
      break;
    }
    if (name.startsWith('knex.config')) {
      knexConfig = full;
      source = 'knexConfig';
      break;
    }
  }

  const ormPath = join(rootDir, 'orm.config.js');
  if (existsSync(ormPath) && source === 'none') {
    ormConfig = ormPath;
    source = 'ormConfig';
  }

  return { knexfile, knexConfig, ormConfig, source };
}

function detectMonorepo(rootDir: string): boolean {
  const pkgPath = join(rootDir, 'package.json');
  if (!existsSync(pkgPath)) return false;
  try {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8')) as {
      workspaces?: unknown;
    };
    if (pkg.workspaces) return true;
  } catch {
    // ignore JSON errors
  }
  const pnpmWorkspace = join(rootDir, 'pnpm-workspace.yaml');
  return existsSync(pnpmWorkspace);
}

export async function detectProjectStructure(startCwd: string = process.cwd()): Promise<ProjectContext> {
  const rootDir = findProjectRoot(startCwd);
  const srcDir = existsSync(join(rootDir, 'src')) ? join(rootDir, 'src') : undefined;
  const distDir = existsSync(join(rootDir, 'dist')) ? join(rootDir, 'dist') : undefined;

  const cfg = detectConfigFiles(rootDir);
  const isMonorepo = detectMonorepo(rootDir);

  const paths: ProjectPaths = {
    rootDir,
    srcDir,
    distDir,
    entitiesDir: undefined,
    migrationsDir: undefined,
    configFiles: {
      knexfile: cfg.knexfile,
      knexConfig: cfg.knexConfig,
      ormConfig: cfg.ormConfig,
      packageJson: join(rootDir, 'package.json'),
    },
    isMonorepo,
  };

  return {
    paths,
    configSource: cfg.source,
  };
}

export interface MigrateGenerateFlags extends CliFlags {}

export async function resolveProjectContextForMigrateGenerate(
  flags: MigrateGenerateFlags,
  startCwd?: string,
): Promise<ProjectContext & { entitiesPath: string; migrationsDir: string }> {
  const ctx = await detectProjectStructure(startCwd);
  const resolved = await resolvePaths(flags, ctx.paths.rootDir);

  ctx.paths.entitiesDir = dirname(resolved.entitiesPath);
  ctx.paths.migrationsDir = resolved.migrationsDir;

  return {
    ...ctx,
    entitiesPath: resolved.entitiesPath,
    migrationsDir: resolved.migrationsDir,
  };
}

export { EntitiesPathNotFoundError, MigrationsDirNotFoundError };

