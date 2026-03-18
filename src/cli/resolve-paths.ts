import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

export interface CliFlags {
  entities?: string;
  migrationsDir?: string;
}

export interface ResolvedPaths {
  entitiesPath: string;
  migrationsDir: string;
}

export class EntitiesPathNotFoundError extends Error {
  constructor(message = 'No entities directory found') {
    super(message);
    this.name = 'EntitiesPathNotFoundError';
  }
}

export class MigrationsDirNotFoundError extends Error {
  constructor(message = 'No migrations directory found') {
    super(message);
    this.name = 'MigrationsDirNotFoundError';
  }
}

interface SimpleConfig {
  entitiesDir?: string;
  migrationsDir?: string;
}

export async function resolvePaths(flags: CliFlags, cwd: string = process.cwd()): Promise<ResolvedPaths> {
  const base = cwd;
  const config = await loadConfigFromKnexfile(base);

  let entities = flags.entities;
  let migrations = flags.migrationsDir;

  if (!entities && config?.entitiesDir) {
    entities = config.entitiesDir;
  }

  if (!migrations && config?.migrationsDir) {
    migrations = config.migrationsDir;
  }

  if (!entities) {
    const entityCandidates = ['./dist/entities', './src/entities', './entities'];
    const found = entityCandidates.map((p) => resolve(base, p)).find((p) => existsSync(p));
    if (found) {
      entities = found;
    }
  }

  if (!migrations) {
    const migrationCandidates = ['./migrations', './dist/migrations', './src/migrations'];
    const found = migrationCandidates.map((p) => resolve(base, p)).find((p) => existsSync(p));
    if (found) {
      migrations = found;
    }
  }

  if (!entities) {
    throw new EntitiesPathNotFoundError();
  }

  if (!migrations) {
    throw new MigrationsDirNotFoundError();
  }

  return {
    entitiesPath: resolve(base, entities),
    migrationsDir: resolve(base, migrations),
  };
}

async function loadConfigFromKnexfile(cwd: string): Promise<SimpleConfig | undefined> {
  const filenames = [
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
  ];

  const candidates = filenames.map((name) => resolve(cwd, name));
  const requireFn = createRequire(resolve(cwd, 'package.json'));

  for (const file of candidates) {
    if (!existsSync(file)) continue;

    const ext = file.split('.').pop();
    let raw: unknown;

    try {
      if (ext === 'ts' || ext === 'mjs') {
        const mod = await import(pathToFileURL(file).href);
        raw = (mod as { default?: unknown }).default ?? mod;
      } else {
        raw = requireFn(file);
      }
    } catch {
      continue;
    }

    if (!raw || typeof raw !== 'object') continue;

    const cfg = raw as { entitiesDir?: string; migrationsDir?: string };
    if (cfg.entitiesDir || cfg.migrationsDir) {
      return {
        entitiesDir: cfg.entitiesDir,
        migrationsDir: cfg.migrationsDir,
      };
    }
  }

  return undefined;
}
