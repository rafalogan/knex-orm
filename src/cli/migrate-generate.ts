#!/usr/bin/env node
/**
 * knex-orm CLI
 *
 * Comandos:
 *   migrate:generate  Gera migration a partir das entidades
 *   migrate:run       Executa knex.migrate.latest()
 *   migrate:rollback  Executa knex.migrate.rollback()
 *
 * Uso:
 *   knex-orm migrate:generate --entities=./src/entities
 *   knex-orm migrate:run [--config=./knexfile.js]
 *   knex-orm migrate:rollback [--config=./knexfile.js]
 */
import 'reflect-metadata';

type Command = 'migrate:generate' | 'migrate:run' | 'migrate:rollback';

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const cmd = args[0] as Command | undefined;

  const known: Command[] = ['migrate:generate', 'migrate:run', 'migrate:rollback'];
  if (!cmd || !known.includes(cmd)) {
    console.error(
      'Usage: knex-orm <command>\n' +
        '  migrate:generate  Generate migration from entities\n' +
        '  migrate:run       Run pending migrations (knex.migrate.latest)\n' +
        '  migrate:rollback  Rollback last migration (knex.migrate.rollback)\n\n' +
        'Examples:\n' +
        '  knex-orm migrate:generate --entities=./src/entities\n' +
        '  knex-orm migrate:run\n' +
        '  knex-orm migrate:rollback',
    );
    process.exit(1);
  }

  if (cmd === 'migrate:generate') {
    await runMigrateGenerate(args);
  } else if (cmd === 'migrate:run') {
    await runMigrateRun(args);
  } else if (cmd === 'migrate:rollback') {
    await runMigrateRollback(args);
  }
}

async function runMigrateGenerate(args: string[]): Promise<void> {
  const entitiesPath = args.find((a) => a.startsWith('--entities='))?.split('=')[1];
  const migrationsDir =
    args.find((a) => a.startsWith('--migrations-dir='))?.split('=')[1] ?? 'migrations';

  if (!entitiesPath) {
    console.error(
      'Usage: knex-orm migrate:generate --entities=<path>\n' +
        '  --entities=./src/entities  Path to module exporting { entities: [...] }\n' +
        '  --migrations-dir=migrations  Output directory (default: migrations)',
    );
    process.exit(1);
  }

  const { resolve } = await import('node:path');
  const absPath = resolve(process.cwd(), entitiesPath);
  const resolved = await import(absPath).catch((err: Error) => {
    console.error(`Failed to load entities from ${entitiesPath}:`, err.message);
    process.exit(1);
  });

  const raw = resolved.entities ?? resolved.default?.entities ?? resolved.default;
  const entities = (Array.isArray(raw) ? raw : [raw].filter(Boolean)) as (new () => object)[];
  if (!Array.isArray(entities) || entities.length === 0) {
    console.error('No entities found. Export { entities: [User, Post, ...] } from your module.');
    process.exit(1);
  }

  const { MigrationEngine } = await import('../adapters/migration/migration-engine.js');
  const engine = new MigrationEngine();

  const result = await engine.generate({
    entities,
    migrationsDir,
    schemaPath: '.orm-schema.json',
  });

  if (result.migrationPath) {
    console.log(`Migration generated: ${result.migrationPath}`);
    console.log(`Operations: ${result.opsCount}`);
  } else {
    console.log('No schema changes detected.');
  }
}

async function loadKnexFromConfig(configPath?: string): Promise<import('knex').Knex> {
  const { resolve, join } = await import('node:path');
  const { existsSync } = await import('node:fs');
  const { pathToFileURL } = await import('node:url');

  const cwd = process.cwd();
  const candidates = configPath
    ? [resolve(cwd, configPath)]
    : [
        join(cwd, 'knexfile.js'),
        join(cwd, 'knexfile.cjs'),
        join(cwd, 'knexfile.mjs'),
      ];

  let configModule: Record<string, unknown> | ((env: string) => Record<string, unknown>) | null =
    null;

  for (const p of candidates) {
    if (existsSync(p)) {
      try {
        const mod = await import(pathToFileURL(p).href);
        configModule = (mod.default ?? mod) as
          | Record<string, unknown>
          | ((env: string) => Record<string, unknown>);
        break;
      } catch {
        continue;
      }
    }
  }

  if (!configModule) {
    throw new Error(
      'Knex config not found. Create knexfile.js in project root or pass --config=./path/to/knexfile.js',
    );
  }

  const env = process.env.NODE_ENV ?? 'development';
  const config =
    typeof configModule === 'function'
      ? configModule(env)
      : (configModule[env] as Record<string, unknown>) ?? configModule;

  const knex = (await import('knex')).default;
  return knex(config as import('knex').Knex.Config);
}

async function runMigrateRun(args: string[]): Promise<void> {
  const configPath = args.find((a) => a.startsWith('--config='))?.split('=')[1];

  const k = await loadKnexFromConfig(configPath);
  try {
    const [batch, migrations] = await k.migrate.latest();
    if (migrations.length === 0) {
      console.log('Already up to date.');
    } else {
      console.log(`Batch ${batch} run: ${migrations.length} migration(s)`);
      migrations.forEach((m: string) => console.log(`  - ${m}`));
    }
  } finally {
    await k.destroy();
  }
}

async function runMigrateRollback(args: string[]): Promise<void> {
  const configPath = args.find((a) => a.startsWith('--config='))?.split('=')[1];

  const k = await loadKnexFromConfig(configPath);
  try {
    const [batch, migrations] = await k.migrate.rollback();
    if (migrations.length === 0) {
      console.log('Already at the base migration.');
    } else {
      console.log(`Batch ${batch} rolled back: ${migrations.length} migration(s)`);
      migrations.forEach((m: string) => console.log(`  - ${m}`));
    }
  } finally {
    await k.destroy();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
