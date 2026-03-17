## Introduction

**knx-orm** is an NPM library that extends **Knex.js** with an ORM pattern based on decorators, while keeping full compatibility with Knex’s native API.  
Instead of replacing Knex, it adds:

- **Entity decorators** (`@Entity`, `@Column`, `@PrimaryKey`, etc.)
- A **generic typed repository** (`Repository<T>`) for CRUD, pagination and filters
- **Migration generation** from entities (on top of Knex migrations)
- **NestJS integration** via `KnexOrmModule`
- **Node.js and Bun support** with the same API (`isBun`, `isNode`, `getRuntime`)

This lets projects that already use Knex adopt ORM conventions incrementally, without changing stack or losing access to low‑level queries.

---

## Problem it solves

Knex provides a great query builder, but it does not offer:

- Object–relational mapping using TypeScript classes
- Timestamps and soft‑delete conventions
- A generic, strongly typed repository
- Migrations derived from entities
- First‑class NestJS integration

knx-orm fills exactly that gap:

- Keeps Knex as the underlying engine
- Uses decorators to describe the schema
- Uses metadata to generate migrations and map DB rows to entities
- Exposes a simple, testable generic repository

---

## Comparison with alternatives

Positioning relative to well‑known ORMs:

| Aspect   | knx-orm                                     | TypeORM                             | Prisma                | MikroORM             |
| -------- | ------------------------------------------- | ----------------------------------- | --------------------- | -------------------- |
| Base     | Knex.js (query builder)                     | Custom driver                       | Prisma Client         | Custom driver        |
| Schema   | Decorators on TS classes                    | Decorators                          | Declarative `.prisma` | Decorators           |
| Migrate  | Generation from entities + Knex migrations  | Sync or manual migrations           | `prisma migrate`      | Manual migrations    |
| Raw SQL  | Direct Knex access                          | `QueryRunner`                       | Limited               | Custom API           |
| Multi‑DB | Through Knex (PG, MySQL, SQLite, MSSQL etc) | Native                               | Native                | Native               |
| NestJS   | Dedicated module (`KnexOrmModule`)          | Official module                     | Official module       | Official module      |

**Main differentiator:** for teams already using Knex, adoption is incremental — you can keep using `knex('table')...` where it makes sense, and use the ORM where it adds most value.

---

## Stack and compatibility

Based on `package.json`, `tsconfig.json` and `docs/knex-orm-superset.md`:

- **Runtimes**: Node.js ≥ 18, Bun ≥ 1.0
- **Language**: TypeScript (strict, `experimentalDecorators`, `emitDecoratorMetadata`)
- **Base**: Knex.js
- **Optional framework**: NestJS (9, 10 and 11)
- **Databases** (via Knex):
  - PostgreSQL
  - MySQL / MySQL2
  - SQLite3 (Node)
  - MSSQL
  - Oracle

On Bun, native‑addon drivers (like `sqlite3`) are not supported; prefer PostgreSQL or MySQL.

---

## Typical use cases

- **Node.js “vanilla” applications**
  - Scripts and services that need a lightweight ORM without a framework
  - Simple, testable generic repositories (see integration tests under `test/integration/node-vanilla`)
- **APIs (REST/GraphQL) with NestJS**
  - `KnexOrmModule` with `forRoot` / `forFeature`
  - Injection of `IRepository<Entity>` using `@InjectRepository`
  - Optional `@InjectConnection` when direct Knex access is needed
- **CLI tools and pipelines**
  - Using `knx` / `knx-orm` binaries to generate and run migrations
  - Running under CI with Node or Bun

---

## Project status

According to `docs/knex-orm-superset.md` and `AUDIT.md`:

- **Current 1.x state**:
  - Core decorators implemented (`@Entity`, `@Column`, `@PrimaryKey`, `@CreatedAt`, `@UpdatedAt`, `@SoftDelete`, `@Index`)
  - Generic repository (`Repository<T>`) with CRUD, pagination, filters and transactions
  - Migration engine from entities (`MigrationEngine`, `SchemaDiff`, `SchemaRegistry`, `MigrationGenerator`, `MigrationWriter`)
  - CLI commands: `migrate:generate`, `migrate:run`, `migrate:rollback`, `connection:init`, `connection:test`, `connection:list`
  - NestJS integration (`KnexOrmModule`, `@InjectRepository`, `@InjectConnection`)
  - Node.js and Bun support (runtime detection in `src/core/runtime.ts`)
- **1.x roadmap**:
  - Relations (`@OneToMany`, `@ManyToOne`, `@ManyToMany`)
  - Strongly typed query builder on top of the repository
  - Advanced transactions and unit‑of‑work
- **2.x roadmap**:
  - Runtime schema validation
  - Auto‑migrate for development environments
  - Plugin system

Always check `docs/knex-orm-superset.md` and the `CHANGELOG` for the exact status of the version you use.

---

## License

The project is distributed under the **MIT** license (see the `LICENSE` file at the repo root).  
This allows usage in open‑source and proprietary projects, including commercial environments, as long as the license is preserved.

