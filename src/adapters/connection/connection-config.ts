import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import type { Knex } from 'knex';

/**
 * Single connection configuration (Knex-compatible).
 */
export interface ConnectionEntry {
  client: string;
  connection: Knex.StaticConnectionConfig | Knex.ConnectionConfigProvider;
  pool?: { min?: number; max?: number };
  migrations?: { directory?: string; tableName?: string };
}

/**
 * ORM config: default connection name + named connections.
 */
export interface OrmConfig {
  default: string;
  connections: Record<string, ConnectionEntry>;
}

/**
 * Config that can be flat (OrmConfig) or env-keyed.
 */
export type OrmConfigModule =
  | OrmConfig
  | {
      development?: OrmConfig;
      test?: OrmConfig;
      production?: OrmConfig;
    };

function hasEnvKeys(
  config: OrmConfigModule,
): config is { development?: OrmConfig; test?: OrmConfig; production?: OrmConfig } {
  return (
    'development' in config || 'test' in config || 'production' in config
  );
}

/** Config file names to search (in order). */
const CONFIG_CANDIDATES = [
  'orm.config.js',
  'orm.config.cjs',
  'knex-orm.config.js',
  'knex-orm.config.cjs',
  'knexfile.js',
  'knexfile.cjs',
];

/**
 * Loads and resolves ORM connection configuration.
 */
export class ConnectionConfigLoader {
  /**
   * Finds config file in directory. Returns first existing path or null.
   */
  findConfigPath(cwd: string = process.cwd()): string | null {
    for (const name of CONFIG_CANDIDATES) {
      const p = join(cwd, name);
      if (existsSync(p)) return p;
    }
    return null;
  }
  /**
   * Loads config from a file path (.js, .mjs, .cjs).
   * Returns null if file does not exist or load fails.
   */
  async loadFromPath(path: string): Promise<OrmConfigModule | null> {
    const absolute = resolve(path);
    if (!existsSync(absolute)) return null;

    try {
      const req = createRequire(resolve(process.cwd(), 'package.json'));
      const raw = req(absolute) as unknown;
      if (!raw || typeof raw !== 'object') return null;
      if (
        ('connections' in (raw as object) && typeof (raw as OrmConfig).connections === 'object') ||
        'development' in (raw as object) ||
        'test' in (raw as object) ||
        'production' in (raw as object)
      ) {
        return raw as OrmConfigModule;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Resolves config for the given environment.
   * If config has development/test/production keys, returns that section.
   * Handles knexfile format: { env: { client, connection } } -> OrmConfig.
   */
  resolveForEnv(config: OrmConfigModule, env: string): OrmConfig | null {
    if (hasEnvKeys(config)) {
      const section =
        (config as Record<string, OrmConfig | unknown>)[env] ??
        (config as Record<string, OrmConfig | undefined>).development;
      if (!section || typeof section !== 'object') return null;
      if (isOrmConfig(section)) return section;
      return { default: 'default', connections: { default: section as ConnectionEntry } };
    }
    return config as OrmConfig;
  }
}

function isOrmConfig(val: unknown): val is OrmConfig {
  return (
    val !== null &&
    typeof val === 'object' &&
    'connections' in (val as object) &&
    typeof (val as OrmConfig).connections === 'object'
  );
}
