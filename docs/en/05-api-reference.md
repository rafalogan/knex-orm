## Overview

This reference describes the **public exports** of the `knx-orm` package, based on `src/index.ts` and the actual types/implementations.  
For architectural background and design decisions, see `docs/knex-orm-superset.md`.

---

## Decorators

Exported from `src/index.ts`:

- `Entity`
- `Column`
- `PrimaryKey`
- `CreatedAt`
- `UpdatedAt`
- `getEntityMetadata`

Simplified signatures (check `src/core/decorators` and `src/core/types` for exact types):

```typescript
function Entity(tableName?: string): ClassDecorator;

interface ColumnOptions {
  type: string;
  nullable?: boolean;
  default?: unknown;
  unique?: boolean;
  index?: boolean;
  // more fields mapped to Knex schema options
}

function Column(options: ColumnOptions): PropertyDecorator;
function PrimaryKey(): PropertyDecorator;
function CreatedAt(): PropertyDecorator;
function UpdatedAt(): PropertyDecorator;

function getEntityMetadata(target: Function): EntityMetadata | undefined;
```

`EntityMetadata` and `ColumnMetadata` are described next.

---

## Metadata types

Exported from `src/index.ts`:

- `EntityMetadata`
- `ColumnMetadata`
- `ColumnOptions`

These types live in `src/core/types/entity-metadata.ts` and `src/core/types/column-metadata.ts`.  
In simplified form:

```typescript
interface ColumnMetadata {
  propertyName: string;
  columnName: string;
  type: string;
  nullable?: boolean;
  defaultValue?: unknown;
  unique?: boolean;
  indexed?: boolean;
}

interface EntityMetadata {
  target: Function;
  tableName: string;
  columns: Record<string, ColumnMetadata>;
  primaryKey?: {
    propertyName: string;
    columnName: string;
  };
  softDelete?: {
    propertyName: string;
    columnName: string;
  };
}
```

These types are used by `Repository<T>`, schema builders and the migration diff engine.

---

## Repository

Exported in `src/index.ts`:

- `Repository`
- `IRepository<T>` (alias)
- `PaginateOptions`
- `PaginateResult`
- `FindManyOptions`
- `FindOptions`
- `WhereClause`
- `IdsFilter`

### Conceptual `IRepository<T>` interface

Methods are aligned with `src/adapters/repository/repository.ts` and the architecture document:

```typescript
interface WhereClause<T> {
  [K in keyof T]?: T[K] | { $eq?: T[K]; $ne?: T[K]; $in?: T[K][]; $like?: string };
}

interface FindOptions<T> {
  select?: (keyof T)[];
  where?: WhereClause<T>;
  orderBy?: { [K in keyof T]?: 'asc' | 'desc' };
  limit?: number;
  offset?: number;
  withDeleted?: boolean;
}

interface PaginateOptions {
  page?: number;
  limit?: number;
  orderBy?: string;
  order?: 'asc' | 'desc';
}

interface PaginateResult<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface IRepository<T> {
  create(data: Partial<T>): Promise<T>;
  createMany(data: Partial<T>[]): Promise<T[]>;
  save(entity: Partial<T>, where?: WhereClause<T>): Promise<T>;
  find(options?: FindOptions<T>): Promise<T[]>;
  findOne(where: WhereClause<T>): Promise<T | null>;
  findMany(options?: FindManyOptions<T>): Promise<T[]>;
  findById(id: string | number): Promise<T | null>;
  update(where: Partial<T> | { [key: string]: string | number }, data: Partial<T>): Promise<T>;
  updateMany(where: { ids: (string | number)[] }, data: Partial<T>): Promise<number>;
  delete(where: Partial<T> | { [key: string]: string | number }): Promise<void>;
  deleteMany(where: { ids: (string | number)[] }): Promise<number>;
  disable(where: WhereClause<T>): Promise<void>;
  paginate(options?: PaginateOptions): Promise<PaginateResult<T>>;
}
```

In the current implementation, `IRepository<T>` is an alias to `Repository<T>` (see `src/index.ts`).

### Usage example

```typescript
import { Repository } from 'knx-orm';
import type { Knex } from 'knex';
import { Product } from './product.entity';

declare const knex: Knex;

const repo = new Repository<Product>(knex, Product);

const list = await repo.find({ where: { price: { $in: [10, 20] } } as any });
```

---

## Migration engine

Exported from `src/index.ts`:

- `MigrationEngine`
- `SchemaBuilder`
- `SchemaDiff`
- `SchemaRegistry`
- `MigrationGenerator`
- `MigrationWriter`
- `EntityScanner`
- Types `GenerateOptions`, `GenerateResult`, `MigrationOp`, `OrmSchema`

These APIs are mostly used by the CLI and automation tools; most end‑users interact via the `kor` command.

### Conceptual example of migration generation

```typescript
import { EntityScanner, MigrationEngine } from 'knx-orm';

const entities = EntityScanner.scanFromPaths(['./dist/entities']);

const engine = new MigrationEngine({
  entities,
  schemaRegistry: new SchemaRegistry(/* ... */),
  migrationGenerator: new MigrationGenerator(/* ... */),
  migrationWriter: new MigrationWriter(/* ... */),
});

const result = await engine.generate({
  entitiesPath: './dist/entities',
  migrationsDir: './migrations',
});

console.log(result.files); // generated migration files
```

For the full flow, see `docs/en/08-migrations.md`.

---

## KnexAdapter

Exported in `src/index.ts`:

- `KnexAdapter`

`KnexAdapter` implements the core connection interface on top of the Knex client.  
In general, you won’t instantiate it directly — it is used internally by `ConnectionFactory` / `ConnectionManager` — but it is important to know that:

- It wraps a Knex instance.
- It exposes methods to get the query builder and manage connection lifecycle.

---

## Runtime (Node/Bun)

Exported in `src/index.ts` from `src/core/runtime.ts`:

- `isBun()`
- `isNode()`
- `getRuntime()`
- `getEnv()`
- Type `Runtime`

Signatures:

```typescript
type Runtime = 'node' | 'bun';

function isBun(): boolean;
function isNode(): boolean;
function getRuntime(): Runtime;
function getEnv(key: string): string | undefined;
```

### Example

```typescript
import { getRuntime, getEnv } from 'knx-orm';

const runtime = getRuntime(); // 'node' or 'bun'
const dbHost = getEnv('DB_HOST') ?? 'localhost';
```

---

## Security

Exported in `src/index.ts`:

- `redactConnectionConfig`
- `isValidSqlIdentifier`

These functions live in `src/core/security` and are used to:

- Ensure table/column names are valid identifiers before generating SQL.
- Remove sensitive data (such as passwords / connection strings) when logging configs.

Simplified signatures:

```typescript
function isValidSqlIdentifier(name: string): boolean;

function redactConnectionConfig<T extends object>(config: T): T;
```

---

## Connections and KnexORM

Exported in `src/index.ts` from `src/adapters/connection`:

- `KnexORM`
- `ConnectionManager`
- `ConnectionConfigLoader`
- `ConnectionFactory`
- `ConnectionRegistry`
- Types `OrmConfig`, `OrmConfigModule`, `ConnectionEntry`

### Main types

Full types are in `src/adapters/connection/connection-config.ts`, but conceptually:

```typescript
interface ConnectionEntry {
  client: string;
  connection: unknown; // configuration object accepted by Knex
  pool?: { min?: number; max?: number };
}

interface OrmConfig {
  default: string;
  connections: Record<string, ConnectionEntry>;
}
```

### `KnexORM` API

Signatures may evolve, but typical usage (based on the superset doc and examples) is:

```typescript
class KnexORM {
  static initialize(config: OrmConfig): Promise<KnexORM>;
  static initializeFromPath(path?: string): Promise<KnexORM>;

  getRepository<T>(entity: new () => T): Repository<T>;
  getConnection(name?: string): import('knex').Knex;
  getDefaultConnection(): import('knex').Knex;
  close(): Promise<void>;
}
```

### Example

```typescript
import { KnexORM } from 'knx-orm';
import { User } from './entities/user';

const orm = await KnexORM.initialize({
  default: 'primary',
  connections: {
    primary: {
      client: 'postgresql',
      connection: { host: 'localhost', database: 'app' },
    },
  },
});

const repo = orm.getRepository(User);
const users = await repo.find({});

await orm.close();
```

---

## NestJS module

The `knx-orm/nestjs` subpath exports:

- `KnexOrmModule`
- `InjectRepository`
- `InjectConnection`
- `getRepositoryToken`
- `getConnectionToken`
- `KNEX_ORM_CONNECTION_MANAGER`

These APIs are described in detail in `docs/en/04-usage-guide.md` (NestJS section); refer there for complete examples.

