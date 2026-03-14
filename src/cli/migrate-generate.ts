#!/usr/bin/env node
/**
 * knex-orm migrate:generate
 *
 * Gera migration Knex a partir das entidades.
 * Uso: npx knex-orm migrate:generate --entities=./src/entities
 */
import 'reflect-metadata';

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args[0] !== 'migrate:generate') {
    console.error('Usage: knex-orm migrate:generate --entities=<path>');
    process.exit(1);
  }
  const entitiesPath = args.find((a) => a.startsWith('--entities='))?.split('=')[1];
  const migrationsDir = args.find((a) => a.startsWith('--migrations-dir='))?.split('=')[1] ?? 'migrations';

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
  const resolved = await import(absPath).catch((err) => {
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

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
