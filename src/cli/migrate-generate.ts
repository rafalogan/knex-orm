#!/usr/bin/env node
/**
 * knex-orm CLI
 *
 * Comandos:
 *   migrate:generate   Gera migration a partir das entidades
 *   migrate:run        Executa knex.migrate.latest()
 *   migrate:rollback   Executa knex.migrate.rollback()
 *   connection:init    Cria arquivo orm.config.js
 *   connection:test    Testa conexões configuradas
 *   connection:list    Lista conexões configuradas
 */
import 'reflect-metadata';

type Command =
  | 'migrate:generate'
  | 'migrate:run'
  | 'migrate:rollback'
  | 'connection:init'
  | 'connection:test'
  | 'connection:list';

const ALL_COMMANDS: Command[] = [
  'migrate:generate',
  'migrate:run',
  'migrate:rollback',
  'connection:init',
  'connection:test',
  'connection:list',
];

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const cmd = args[0] as Command | undefined;

  if (!cmd || !ALL_COMMANDS.includes(cmd)) {
    console.error(
      'Usage: kor <command>  (or: knex-orm <command>)\n' +
        '  migrate:generate   Generate migration from entities\n' +
        '  migrate:run        Run pending migrations\n' +
        '  migrate:rollback   Rollback last migration\n' +
        '  connection:init    Create orm.config.js template\n' +
        '  connection:test    Test database connections\n' +
        '  connection:list    List configured connections\n\n' +
        'Examples:\n' +
        '  kor migrate:generate --entities=./src/entities\n' +
        '  kor migrate:run\n' +
        '  kor connection:init',
    );
    process.exit(1);
  }

  if (cmd === 'migrate:generate') await runMigrateGenerate(args);
  else if (cmd === 'migrate:run') await runMigrateRun(args);
  else if (cmd === 'migrate:rollback') await runMigrateRollback(args);
  else if (cmd === 'connection:init') await runConnectionInit(args);
  else if (cmd === 'connection:test') await runConnectionTest(args);
  else if (cmd === 'connection:list') await runConnectionList(args);
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

async function loadKnexForMigrate(configPath?: string): Promise<import('knex').Knex> {
  const { resolve, join } = await import('node:path');
  const { existsSync } = await import('node:fs');
  const { createRequire } = await import('node:module');

  const cwd = process.cwd();
  const { ConnectionConfigLoader } = await import(
    '../adapters/connection/connection-config.js'
  );
  const { ConnectionFactory } = await import(
    '../adapters/connection/connection-factory.js'
  );
  const loader = new ConnectionConfigLoader();

  const path = configPath ? resolve(cwd, configPath) : loader.findConfigPath();
  const toTry = path ? [path] : [join(cwd, 'knexfile.js'), join(cwd, 'knexfile.cjs')];

  for (const p of toTry) {
    if (!existsSync(p)) continue;

    const raw = await loader.loadFromPath(p);
    if (!raw) continue;

    const env = process.env.NODE_ENV ?? 'development';
    const ormConfig = loader.resolveForEnv(raw, env);
    const defaultName = ormConfig?.default;
    const defaultConn =
      defaultName && ormConfig?.connections
        ? ormConfig.connections[defaultName]
        : undefined;
    if (defaultConn) {
      const factory = new ConnectionFactory();
      return factory.create(defaultConn);
    }

    const req = createRequire(resolve(cwd, 'package.json'));
    const mod = req(p) as Record<string, unknown>;
    const cfg = (mod[env] ?? mod.development ?? mod) as Record<string, unknown>;
    if (cfg?.client && cfg?.connection) {
      const knex = req('knex');
      return knex(cfg);
    }
  }

  throw new Error(
    'Config not found. Run: kor connection:init or create knexfile.js',
  );
}

async function runMigrateRun(args: string[]): Promise<void> {
  const configPath = args.find((a) => a.startsWith('--config='))?.split('=')[1];

  const k = await loadKnexForMigrate(configPath);
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

  const k = await loadKnexForMigrate(configPath);
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

async function runConnectionInit(_args: string[]): Promise<void> {
  const { writeFile } = await import('node:fs/promises');
  const { join } = await import('node:path');

  const content = `/** @type {import('knex-orm').OrmConfig} */
module.exports = {
  default: 'primary',
  connections: {
    primary: {
      client: 'sqlite3',
      connection: {
        filename: process.env.DB_PATH || ':memory:',
      },
      pool: { min: 0, max: 5 },
    },
  },
};
`;

  const path = join(process.cwd(), 'orm.config.js');
  await writeFile(path, content, 'utf-8');
  console.log(`Created ${path}`);
}

async function runConnectionTest(args: string[]): Promise<void> {
  const configPath = args.find((a) => a.startsWith('--config='))?.split('=')[1];
  const { ConnectionConfigLoader } = await import('../adapters/connection/connection-config.js');
  const { ConnectionManager } = await import('../adapters/connection/connection-manager.js');

  const loader = new ConnectionConfigLoader();
  const path = configPath ?? loader.findConfigPath();
  if (!path) {
    console.error('No config file found. Run: kor connection:init');
    process.exit(1);
  }

  const manager = new ConnectionManager();
  try {
    await manager.initializeFromPath(path);
    for (const name of manager.getRegistry().list()) {
      const knex = manager.getConnection(name);
      await knex.raw('SELECT 1');
      console.log(`  ✓ ${name}`);
    }
    console.log('All connections OK.');
  } catch (err) {
    console.error('Connection test failed:', (err as Error).message);
    process.exit(1);
  } finally {
    await manager.closeAll();
  }
}

async function runConnectionList(args: string[]): Promise<void> {
  const configPath = args.find((a) => a.startsWith('--config='))?.split('=')[1];
  const { ConnectionConfigLoader } = await import('../adapters/connection/connection-config.js');
  const { ConnectionManager } = await import('../adapters/connection/connection-manager.js');

  const loader = new ConnectionConfigLoader();
  const path = configPath ?? loader.findConfigPath();
  if (!path) {
    console.error('No config file found. Run: kor connection:init');
    process.exit(1);
  }

  const manager = new ConnectionManager();
  try {
    await manager.initializeFromPath(path);
    const names = manager.getRegistry().list();
    console.log('Configured connections:', names.join(', '));
  } finally {
    await manager.closeAll();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
