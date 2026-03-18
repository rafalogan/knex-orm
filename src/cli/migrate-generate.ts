#!/usr/bin/env node
/**
 * knx-orm CLI
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
import {
  EntitiesPathNotFoundError,
  MigrationsDirNotFoundError,
  resolveProjectContextForMigrateGenerate,
} from './project-introspection';

type Command =
  | 'migrate:generate'
  | 'migrate:run'
  | 'migrate:rollback'
  | 'connection:init'
  | 'connection:test'
  | 'connection:list'
  | 'entity:generate';

const ALL_COMMANDS: Command[] = [
  'migrate:generate',
  'migrate:run',
  'migrate:rollback',
  'connection:init',
  'connection:test',
  'connection:list',
  'entity:generate',
];

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const cmd = args[0] as Command | undefined;

  if (!cmd || !ALL_COMMANDS.includes(cmd)) {
    console.error(
      'Usage: knx <command>  (or: knx-orm <command>)\n' +
        '  migrate:generate   Generate migration from entities\n' +
        '  migrate:run        Run pending migrations\n' +
        '  migrate:rollback   Rollback last migration\n' +
        '  connection:init    Create orm.config.js template\n' +
        '  connection:test    Test database connections\n' +
        '  connection:list    List configured connections\n' +
        '  entity:generate    Generate entities from migrations\n\n' +
        'Examples:\n' +
        '  knx migrate:generate --entities=./src/entities\n' +
        '  knx entity:generate\n' +
        '  knx connection:init',
    );
    process.exit(1);
  }

  if (cmd === 'migrate:generate') await runMigrateGenerate(args);
  else if (cmd === 'migrate:run') await runMigrateRun(args);
  else if (cmd === 'migrate:rollback') await runMigrateRollback(args);
  else if (cmd === 'connection:init') await runConnectionInit(args);
  else if (cmd === 'connection:test') await runConnectionTest(args);
  else if (cmd === 'connection:list') await runConnectionList(args);
  else if (cmd === 'entity:generate') await runEntityGenerate(args);
}

export async function handleEntityGenerateFromCwd(startCwd: string = process.cwd()): Promise<void> {
  const { resolveProjectContextForMigrateGenerate } = await import('./project-introspection.js');
  const { MigrationParser, EntityFromMigrationGenerator } = await import(
    '../adapters/migration/index.js'
  );
  const { existsSync, mkdirSync, readdirSync } = await import('node:fs');
  const { join, extname, basename } = await import('node:path');

  const ctx = await resolveProjectContextForMigrateGenerate({}, startCwd);
  const rootDir = ctx.paths.rootDir;
  const migrationsDir = ctx.paths.migrationsDir ?? join(rootDir, 'migrations');
  const entitiesDir =
    ctx.paths.entitiesDir ?? ctx.paths.srcDir ?? ctx.paths.distDir ?? join(rootDir, 'entities');

  if (!existsSync(migrationsDir)) {
    console.error(`Migrations directory not found: ${migrationsDir}`);
    process.exit(1);
  }
  if (!existsSync(entitiesDir)) {
    mkdirSync(entitiesDir, { recursive: true });
  }

  const parser = new MigrationParser();
  const generator = new EntityFromMigrationGenerator();

  const files = readdirSync(migrationsDir).filter((f: string) => {
    const ext = extname(f);
    return ext === '.js' || ext === '.cjs' || ext === '.mjs' || ext === '.ts';
  });

  for (const file of files) {
    const full = join(migrationsDir, file);
    const parsed = await parser.parse(full);
    const code = generator.generate(parsed);
    const className = basename(parsed.tableName)
      .replace(/(^\w|_\w)/g, (m: string) => m.replace('_', '').toUpperCase());
    const outPath = join(entitiesDir, `${className}.ts`);
    await (await import('node:fs/promises')).writeFile(outPath, code, 'utf-8');
  }

  console.log(`Entities generated in ${entitiesDir}`);
}

async function runEntityGenerate(_args: string[]): Promise<void> {
  await handleEntityGenerateFromCwd(process.cwd());
}

async function runMigrateGenerate(args: string[]): Promise<void> {
  const entitiesFlag = args.find((a) => a.startsWith('--entities='))?.split('=')[1];
  const migrationsFlag = args.find((a) => a.startsWith('--migrations-dir='))?.split('=')[1];

  let entitiesPath: string;
  let migrationsDir: string;

  const flags: { entities?: string; migrationsDir?: string } = {};
  if (entitiesFlag !== undefined) flags.entities = entitiesFlag;
  if (migrationsFlag !== undefined) flags.migrationsDir = migrationsFlag;

  try {
    const ctx = await resolveProjectContextForMigrateGenerate(
      flags,
      process.cwd(),
    );
    entitiesPath = ctx.entitiesPath;
    migrationsDir = ctx.migrationsDir;
  } catch (err) {
    if (err instanceof EntitiesPathNotFoundError) {
      console.error(
        'Entities directory not found.\n' +
          'Tried config (knexfile*/knex.config*) and default paths: ./dist/entities, ./src/entities, ./entities.\n' +
          'Provide --entities=<path> or configure entitiesDir in your knexfile.',
      );
    } else if (err instanceof MigrationsDirNotFoundError) {
      console.error(
        'Migrations directory not found.\n' +
          'Tried config (knexfile*/knex.config*) and default paths: ./migrations, ./dist/migrations, ./src/migrations.\n' +
          'Provide --migrations-dir=<path> or configure migrationsDir in your knexfile.',
      );
    } else {
      console.error('Failed to resolve paths for migrate:generate:', (err as Error).message);
    }
    process.exit(1);
  }

  const resolved = await import(entitiesPath).catch((err: Error) => {
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
  const { existsSync } = await import('node:fs');
  const { createRequire } = await import('node:module');
  const { resolve, join } = await import('node:path');
  const { detectProjectStructure } = await import('./project-introspection.js');

  const ctx = await detectProjectStructure(process.cwd());
  const cwd = ctx.paths.rootDir;
  const { ConnectionConfigLoader } = await import('../adapters/connection/connection-config.js');
  const { ConnectionFactory } = await import('../adapters/connection/connection-factory.js');
  const loader = new ConnectionConfigLoader();

  const pathFromFlags = configPath ? resolve(cwd, configPath) : undefined;
  const pathFromIntrospection =
    ctx.paths.configFiles.ormConfig ?? ctx.paths.configFiles.knexfile ?? ctx.paths.configFiles.knexConfig;
  const path =
    pathFromFlags ??
    pathFromIntrospection ??
    loader.findConfigPath() ??
    undefined;

  const toTry = path ? [path] : [join(cwd, 'knexfile.js'), join(cwd, 'knexfile.cjs')];

  for (const p of toTry) {
    if (!existsSync(p)) continue;

    const raw = await loader.loadFromPath(p);
    if (!raw) continue;

    const env = process.env.NODE_ENV ?? 'development';
    const ormConfig = loader.resolveForEnv(raw, env);
    const defaultName = ormConfig?.default;
    const defaultConn = defaultName && ormConfig?.connections ? ormConfig.connections[defaultName] : undefined;
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

  throw new Error('Config not found. Run: knx connection:init or create knexfile.js');
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
  const { detectProjectStructure } = await import('./project-introspection.js');

  const ctx = await detectProjectStructure(process.cwd());
  const rootDir = ctx.paths.rootDir;

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

  const path = join(rootDir, 'orm.config.js');
  await writeFile(path, content, 'utf-8');
  console.log(`Created ${path}`);
}

async function runConnectionTest(args: string[]): Promise<void> {
  const configPath = args.find((a) => a.startsWith('--config='))?.split('=')[1];
  const { ConnectionConfigLoader } = await import('../adapters/connection/connection-config.js');
  const { ConnectionManager } = await import('../adapters/connection/connection-manager.js');
  const { detectProjectStructure } = await import('./project-introspection.js');

  const loader = new ConnectionConfigLoader();
  const ctx = await detectProjectStructure(process.cwd());
  const rootDir = ctx.paths.rootDir;
  const pathFromFlags = configPath ? require('node:path').resolve(rootDir, configPath) : undefined;
  const pathFromIntrospection =
    ctx.paths.configFiles.ormConfig ?? ctx.paths.configFiles.knexfile ?? ctx.paths.configFiles.knexConfig;
  const path = pathFromFlags ?? pathFromIntrospection ?? loader.findConfigPath();
  if (!path) {
    console.error('No config file found. Run: knx connection:init');
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
  const { detectProjectStructure } = await import('./project-introspection.js');

  const loader = new ConnectionConfigLoader();
  const ctx = await detectProjectStructure(process.cwd());
  const rootDir = ctx.paths.rootDir;
  const pathFromFlags = configPath ? require('node:path').resolve(rootDir, configPath) : undefined;
  const pathFromIntrospection =
    ctx.paths.configFiles.ormConfig ?? ctx.paths.configFiles.knexfile ?? ctx.paths.configFiles.knexConfig;
  const path = pathFromFlags ?? pathFromIntrospection ?? loader.findConfigPath();
  if (!path) {
    console.error('No config file found. Run: knx connection:init');
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

if (require.main === module) {
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
