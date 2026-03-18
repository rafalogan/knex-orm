## Overview

This guide shows how to use the main features exported by `knx-orm`, with examples based on the real code (`src/` and `test/integration/**`):

- Entity decorators
- `Repository<T>` and related types
- `KnexORM` and connections
- NestJS integration
- CLI usage for migrations

---

## Entity decorators

Decorators live under `src/core/decorators` and are re‑exported from `src/index.ts`. The most important ones:

- `@Entity(tableName?)`
- `@PrimaryKey(options?)`
- `@Column(options)`
- `@CreatedAt()`
- `@UpdatedAt()`
- `@SoftDelete()`
- `@Index(fields[])`

### Minimal example

```typescript
import { Entity, PrimaryKey, Column } from 'knx-orm';

@Entity('products')
export class Product {
  @PrimaryKey()
  id!: number;

  @Column({ type: 'string' })
  name!: string;

  @Column({ type: 'integer' })
  price!: number;
}
```

This pattern is the same used in the repository integration tests (`repository-crud.spec.ts`).

### Example with timestamps and soft delete

```typescript
import { Entity, PrimaryKey, Column, CreatedAt, UpdatedAt, SoftDelete } from 'knx-orm';

@Entity('articles')
export class Article {
  @PrimaryKey()
  id!: number;

  @Column({ type: 'string' })
  title!: string;

  @Column({ type: 'integer' })
  views!: number;

  @CreatedAt()
  createdAt!: Date;

  @UpdatedAt()
  updatedAt!: Date;

  @SoftDelete()
  deletedAt?: Date;
}
```

In the tests (`repository-advanced.spec.ts`), this entity is used to validate pagination, filters, soft delete and transactions.

---

## Repository<T>

The generic repository lives in `src/adapters/repository/repository.ts` and is exported from `src/index.ts` as `Repository`.  
Supporting types (`FindOptions`, `WhereClause`, `PaginateResult`, etc.) are also exported.

### Creating a repository (Node.js)

You usually don’t need to instantiate the repository manually, but it helps to understand the constructor used in integration tests:

```typescript
import knex from 'knex';
import { Repository } from 'knx-orm';
import { Product } from './product.entity';

const db = knex({
  client: 'sqlite3',
  connection: { filename: ':memory:' },
  useNullAsDefault: true,
});

const productRepo = new Repository(db, Product);
```

In most production cases, you will obtain the repository via `KnexORM` (Node vanilla) or via NestJS (`@InjectRepository`).

### Main methods

The methods below come directly from `Repository<T>` and the integration tests:

- **`create(data: Partial<T>): Promise<T>`**
- **`createMany(data: Partial<T>[]): Promise<T[]>`**
- **`find(options?: FindOptions<T>): Promise<T[]>`**
- **`findOne(where: WhereClause<T>): Promise<T | null>`**
- **`findMany(options?: FindManyOptions<T>): Promise<T[]>`**
- **`findById(id: string | number): Promise<T | null>`**
- **`save(entity: Partial<T>, where?: WhereClause<T>): Promise<T>`** (insert or update)
- **`update(where, data): Promise<T>`**
- **`updateMany({ ids }, data): Promise<number>`**
- **`delete(where): Promise<void>`**
- **`deleteMany({ ids }): Promise<number>`**
- **`disable(where): Promise<void>`** (soft delete)
- **`paginate(options?: PaginateOptions): Promise<PaginateResult<T>>`**
- **`transaction(fn): Promise<R>`**
- **`raw(sql, bindings?)`** (raw query via Knex)

#### Example: basic CRUD

```typescript
const created = await productRepo.create({ name: 'Widget', price: 99 });
const foundById = await productRepo.findById(created.id);
const updated = await productRepo.update({ id: created.id }, { price: 120 });
await productRepo.delete({ id: created.id });
```

This scenario is covered by `repository-crud.spec.ts`.

#### Example: advanced filters with `$in` and `$like`

```typescript
// Filter by list of values
const inResults = await articleRepo.find({
  where: { views: { $in: [10, 30] } } as { views: { $in: number[] } },
});

// Filter by prefix
const likeResults = await articleRepo.find({
  where: { title: { $like: 'Hello%' } } as { title: { $like: string } },
});
```

#### Example: pagination

```typescript
const page = await articleRepo.paginate({ page: 1, limit: 10 });

console.log(page.meta.total); // total records
console.log(page.meta.totalPages); // number of pages
console.log(page.data); // records on the current page
```

#### Example: soft delete

```typescript
// Soft delete a record (sets deleted_at)
await articleRepo.disable({ id: 1 });

// find() hides soft‑deleted records by default
const active = await articleRepo.find({});

// withDeleted: true includes soft‑deleted records
const all = await articleRepo.find({ withDeleted: true });
```

#### Example: transactions

```typescript
await articleRepo.transaction(async (trx) => {
  const repoTrx = new Repository(trx as any, Article);
  await repoTrx.create({ title: 'InTx', views: 1 });
  await repoTrx.create({ title: 'InTx2', views: 2 });
});
```

If the function throws, the transaction is rolled back (see `repository-advanced.spec.ts`).

---

## KnexORM and connections

High‑level connection APIs live under `src/adapters/connection` and are exported from `src/index.ts`:

- `KnexORM`
- `ConnectionManager`
- `ConnectionFactory`
- `ConnectionRegistry`
- Types `OrmConfig`, `OrmConfigModule`, `ConnectionEntry`

### Programmatic initialization

```typescript
import { KnexORM } from 'knx-orm';
import { User } from './entities/user';

const orm = await KnexORM.initialize({
  default: 'primary',
  connections: {
    primary: {
      client: 'sqlite3',
      connection: { filename: ':memory:' },
    },
  },
});

const userRepo = orm.getRepository(User);
const users = await userRepo.find({});

await orm.close();
```

### Initialization from config file

As described in `docs/knex-orm-superset.md`:

```typescript
import { KnexORM } from 'knx-orm';

const orm = await KnexORM.initializeFromPath(); // looks for orm.config.js / knex-orm.config.js
const knex = orm.getConnection('primary'); // Knex instance
```

See `@adapters/connection` types for the exact `OrmConfig` shape.

---

## NestJS integration

The `knx-orm/nestjs` submodule re‑exports:

- `KnexOrmModule`
- `InjectRepository`
- `InjectConnection`
- `getRepositoryToken`
- `getConnectionToken`
- `KNEX_ORM_CONNECTION_MANAGER`

### Root module

```typescript
import { Module } from '@nestjs/common';
import { KnexOrmModule } from 'knx-orm/nestjs';
import { Post } from './post.entity';
import { PostService } from './post.service';

@Module({
  imports: [
    KnexOrmModule.forRoot({
      default: 'primary',
      connections: {
        primary: {
          client: 'sqlite3',
          connection: { filename: ':memory:' },
          useNullAsDefault: true,
        },
      },
    }),
    KnexOrmModule.forFeature([Post]),
  ],
  providers: [PostService],
})
export class AppModule {}
```

### Service with `@InjectRepository` and `@InjectConnection`

```typescript
import { Injectable } from '@nestjs/common';
import type { IRepository } from 'knx-orm';
import { InjectRepository, InjectConnection } from 'knx-orm/nestjs';
import type { Knex } from 'knex';
import { Post } from './post.entity';

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(Post) private readonly postRepo: IRepository<Post>,
    @InjectConnection() private readonly knex: Knex,
  ) {}

  async createPost(title: string, published: boolean): Promise<Post> {
    return this.postRepo.create({ title, published });
  }

  async findPublished(): Promise<Post[]> {
    return this.postRepo.find({ where: { published: true } });
  }
}
```

This example closely follows the `nestjs-crud.spec.ts` integration test.

---

## CLI and migrations (summary)

The CLI is exposed via the `knx` and `knx-orm` binaries (configured in `package.json`). Internally it uses:

- `EntityScanner` to find entities
- `SchemaRegistry` to read/write `.orm-schema.json`
- `SchemaDiff` to compute diff operations
- `MigrationGenerator` and `MigrationWriter` to generate migrations

### Main commands

- `knx migrate:generate --entities=./src/entities`
- `knx migrate:run`
- `knx migrate:rollback`
- `knx connection:init`
- `knx connection:test`
- `knx connection:list`

Full details are available in the **Migrations** document (`08-migrations.md`).

---

## Common gotchas

- **Decorators without metadata**: always import `reflect-metadata` before using decorators.
- **Soft delete**: remember that `find()` hides rows with `deleted_at` by default; use `withDeleted: true` if you need to include them.
- **DB types on Bun**: use PostgreSQL or MySQL. SQLite via `sqlite3` is not supported on Bun.
- **TypeScript config**: ensure `experimentalDecorators` and `emitDecoratorMetadata` are enabled in the **consumer project**, not just in the library.
