## Overview

knx-orm generates and runs migrations using **Knex** as the underlying engine.  
On top of that, it provides:

- **Schema diffing** based on entity metadata
- A **state file** (`.orm-schema.json`) to track the previous schema
- A **CLI** (`knx` / `knx-orm`) with commands for generation and execution

All logic lives under `src/adapters/migration` and is described in `docs/knex-orm-superset.md` (§5).

---

## Migration generation flow

The `migrate:generate` flow is:

1. The CLI loads compiled entities (usually from `dist/`).
2. `EntityScanner` reads metadata registered by decorators.
3. `SchemaRegistry` reads the previous schema snapshot from `.orm-schema.json` (if present).
4. `SchemaDiff` compares:
   - **Current entities** vs **previous schema** (not against the live DB).
5. It produces operations (`MigrationOp`) such as `createTable`, `addColumn`, `addIndex`, etc.
6. `MigrationGenerator` transforms these operations into Knex schema code.
7. `MigrationWriter` writes migration files to disk.
8. `SchemaRegistry` persists the new snapshot in `.orm-schema.json`.

Important: the diff is **not** done against the actual DB schema, but against the last known state in `.orm-schema.json`.

---

## Supported diff operations

Based on `SchemaDiff` and the superset doc:

- `createTable` — create a new table
- `dropTable` — drop an existing table
- `addColumn` — add a column
- `dropColumn` — remove a column
- `addIndex` — create indexes (PK, unique, `@Index`, `@Column({ index: true })`)
- `dropIndex` — remove indexes
- `alterColumn` — detected, but often emitted as a comment/TODO because details depend on the DB

When generating migrations, `MigrationGenerator` converts these operations into calls to the Knex Schema Builder.

---

## `.orm-schema.json` file

The `.orm-schema.json` file is used to:

- Store the **previous** schema state (tables, columns, indexes).
- Allow diffing to be computed purely from entities, without inspecting the DB.

High‑level shape (exact types in `OrmSchema`, exported from `src/index.ts`):

```typescript
interface OrmSchema {
  version: number;
  tables: Record<
    string,
    {
      columns: Record<string, unknown>;
      indexes?: Record<string, unknown>;
    }
  >;
}
```

You should not edit this file manually; it is maintained by the CLI.

---

## CLI commands

Scripts in `package.json` point to the main CLI entry:

```json
"bin": {
  "knx": "./dist/cli/migrate-generate.js",
  "knx-orm": "./dist/cli/migrate-generate.js"
}
```

Commands (as per `docs/knex-orm-superset.md` and `AUDIT.md`):

### `migrate:generate` — entities → migrations

The `migrate:generate` command uses the CLI’s **Project Introspection Layer** to auto‑detect project structure:

```bash
npx knx migrate:generate
```

Path resolution order:

1. **CONFIG**: reads `knexfile.*` / `knex.config.*` and uses `entitiesDir` / `migrationsDir` when present.
2. **CONVENTION**: if no config is found, falls back to default directories:
   - Entities: `./dist/entities`, `./src/entities`, `./entities`
   - Migrations: `./migrations`, `./dist/migrations`, `./src/migrations`
3. **CLI FLAGS (override)**: when flags are passed, they take precedence.

Example with explicit overrides:

```bash
npx knx migrate:generate --entities=./dist/entities --migrations-dir=./migrations
```

Supported parameters:

- `--entities` — directory (or file) from which compiled entities are imported.
- `--migrations-dir` — directory where migration files will be written.
- `--config` — optional path to a config file (`orm.config.js` / `knexfile`), when used alongside execution.

### `entity:generate` — migrations → entities

The `entity:generate` command performs the **inverse** flow: it scans existing Knex migrations and generates `knx-orm` entity classes.

```bash
npx knx entity:generate
```

Resolution order is the same as for `migrate:generate`:

1. **CONFIG**: looks for `orm.config.js`, `knexfile.*` or `knex.config.*` and uses configured `migrationsDir` / entities directory when present.
2. **CONVENTION**: if no config is found, falls back to:
   - Migrations: `./migrations`, `./dist/migrations`, `./src/migrations`
   - Entities: `./dist/entities`, `./src/entities`, `./entities`
3. **CLI FLAGS (future)**: the command is designed to support overrides in future versions, mirroring `migrate:generate`.

The generated entities:

- Use `@Entity`, `@PrimaryKey`, `@Column`, `@CreatedAt`, `@UpdatedAt` and `@SoftDelete` decorators.
- Derive class names from table names (e.g. `users` → `User`).
- Map SQL types to TypeScript types (`string`, `number`, `boolean`, `Date`) according to `ColumnType` rules.

### `migrate:run`

```bash
npx knx migrate:run
```

Executes `knex.migrate.latest()` using the discovered configuration (`orm.config.js`, `knexfile`, etc.).  
There are also Node scripts in `package.json`:

```bash
npm run migrate:run
```

### `migrate:rollback`

```bash
npx knx migrate:rollback
```

Executes `knex.migrate.rollback()` using the same configuration source.

### Connection commands

- `knx connection:init` — creates a sample `orm.config.js`.
- `knx connection:test` — tests configured connections.
- `knx connection:list` — lists available connection names.

Matching scripts exist in `package.json` (`connection:init`, `connection:test`, `connection:list`).

---

## Example of a generated migration

A typical migration file generated by `MigrationGenerator` follows standard Knex style:

```typescript
// migrations/20250311120000_create_users.ts
import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('users', (table) => {
    table.increments('id').primary();
    table.string('email', 255).notNullable().unique();
    table.string('name', 255);
    table.boolean('active').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.timestamp('deleted_at');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('users');
}
```

This format is fully compatible with Knex’s native migration system and can be used directly with `knex migrate:*` if desired.

---

## Best practices for migrations

- **Review the generated diff**:
  - Inspect migration files before applying them in shared environments.
  - Avoid destructive changes (`dropTable`, `dropColumn`) without a clear data migration plan.
- **Use `alterColumn` carefully**:
  - Column type changes often depend on the underlying DB.
  - Consider splitting into smaller, explicit migrations instead.
- **Keep naming consistent**:
  - Use `snake_case` for table and column names.
  - Treat decorators and metadata as the source of truth; avoid drifting away with hand‑written migrations.
- **Automate in CI**:
  - In pipelines, it’s common to generate migrations locally and only run `migrate:run` in production.
  - Avoid generating migrations automatically in production environments.
