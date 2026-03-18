## Versioning policy

knex-orm follows:

- **Semantic Versioning (SemVer)** — `MAJOR.MINOR.PATCH`
- **Conventional Commits** — for generating and reading changelogs

In short:

- `MAJOR` — breaking changes (incompatible API changes)
- `MINOR` — backwards‑compatible new features
- `PATCH` — backwards‑compatible bug fixes and small adjustments

Commits of type `feat` typically result in `MINOR` changes, `fix` leads to `PATCH`, and commits with `BREAKING CHANGE:` may trigger a new `MAJOR`.

---

## Guideline for maintaining the CHANGELOG

As a general rule:

- Keep this file in sync with the version in `package.json`.
- For each release:
  - Add a new section with the version number and date.
  - List high‑level changes, not every individual commit.
  - Group by type when it makes sense: “Added”, “Changed”, “Fixed”, “Removed”.

Tools based on Conventional Commits can be used to generate an initial draft, which can then be refined manually.

---

## History

> Note: this section should be updated as new versions are released.  
> The items below are just an initial skeleton based on the architecture described in `docs/knex-orm-superset.md`.  
> Adjust details according to the project’s real release history.

### 1.0.0 — First stable release

- **Added**
  - Core decorators: `@Entity`, `@Column`, `@PrimaryKey`, `@CreatedAt`, `@UpdatedAt`, `@SoftDelete`, `@Index`.
  - Generic repository `Repository<T>` with:
    - `create`, `createMany`, `save`, `find`, `findOne`, `findById`
    - `update`, `updateMany`, `delete`, `deleteMany`, `disable`
    - `paginate`, `transaction`, `raw`
  - Migration engine:
    - `MigrationEngine`, `SchemaBuilder`, `SchemaDiff`, `SchemaRegistry`, `MigrationGenerator`, `MigrationWriter`
    - `.orm-schema.json` state file
  - CLI (`kor` / `knex-orm`):
    - `migrate:generate`, `migrate:run`, `migrate:rollback`
    - `connection:init`, `connection:test`, `connection:list`
  - Node.js “vanilla” integration via `KnexORM.initialize` / `initializeFromPath`.
  - NestJS integration:
    - `KnexOrmModule`, `forRoot`, `forFeature`
    - `@InjectRepository`, `@InjectConnection`
  - Node.js ≥ 18 and Bun ≥ 1.0 support (runtime detection in `src/core/runtime.ts`).
  - Security utilities:
    - `isValidSqlIdentifier`
    - `redactConnectionConfig`

---

## Future versions (roadmap)

The ideas below come from the roadmap described in `docs/knex-orm-superset.md`. They indicate directions, not scheduled releases:

- **1.x**
  - Relation support (`@OneToMany`, `@ManyToOne`, `@ManyToMany`).
  - Typed query builder at the repository level.
  - High‑level transactions (`orm.transaction(...)`) and unit‑of‑work.
- **2.x**
  - Runtime schema validation.
  - Auto‑migrate for development environments.
  - Plugin system (auditing, multitenancy, etc.).

Use tags and GitHub releases as the source of truth for actual version history and dates.
