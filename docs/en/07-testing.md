## Overview

knex-orm is developed with **TDD as a hard rule**, defined in `.rules` and detailed in `docs/DEVELOPMENT.md` and `docs/knex-orm-superset.md` (§9).  
This section explains how to run the tests, how the suite is structured, and how to write new tests following the project’s standards.

---

## How to run tests

Commands are defined in `package.json`:

```bash
# Jest (Node)
npm test
# or
npm run test:node

# Coverage
npm run test:coverage

# Bun test (unit only)
npm run test:bun
```

Summary:

- `npm test` / `npm run test:node` — runs the full Jest suite (Node).
- `npm run test:coverage` — Jest with coverage report (thresholds in `jest.config.js`).
- `npm run test:bun` — runs unit tests with Bun, using `bun test` and `tsconfig.test.json`.

---

## Test structure

According to `.rules`, `DEVELOPMENT.md` and the current code:

```text
test/
  unit/          # Unit tests (decorators, metadata, runtime, adapters with mocks)
  integration/   # Integration tests (Repository + SQLite, migrations, NestJS, Node vanilla)
  fixtures/      # Config and helper data files
```

Important examples:

- `test/unit/decorators/*.spec.ts` — decorator behavior (`@Entity`, `@Column`, etc.).
- `test/unit/core/metadata/entity-scanner.spec.ts` — entity discovery.
- `test/unit/adapters/repository/repository.spec.ts` — repository unit tests.
- `test/integration/repository/repository-crud.spec.ts` — full CRUD with SQLite in‑memory.
- `test/integration/repository/repository-advanced.spec.ts` — pagination, soft delete, transactions.
- `test/integration/migration/*.spec.ts` — migration generation and execution.
- `test/integration/nestjs/nestjs-crud.spec.ts` — end‑to‑end NestJS flow.
- `test/integration/node-vanilla/*.spec.ts` — usage without frameworks.

---

## Test writing guidelines

Rules are defined in `.rules` and reinforced in `docs/DEVELOPMENT.md`:

- **TDD mandatory**:
  - Write the test before the implementation.
  - Confirm the test fails (RED) before coding.
  - Implement the minimum to make the test pass (GREEN).
  - Refactor while keeping tests green (REFACTOR).
- **Isolation**:
  - Use `beforeEach` / `afterEach` to clean up state (DBs, mocks).
  - Avoid depending on test execution order.
- **Descriptive names**:
  - Portuguese: `"deve [resultado] quando [condição]"`.
  - English: `"should [result] when [condition]"`.
- **Coverage targets**:
  - Defined in `jest.config.js`:
    - `statements: 85`
    - `branches: 63`
    - `functions: 85`
    - `lines: 85`

---

## Integration tests with SQLite

Many integration tests use SQLite in‑memory, for example `repository-crud.spec.ts`:

```typescript
import 'reflect-metadata';
import knex, { type Knex } from 'knex';
import { Entity, PrimaryKey, Column } from '@core/decorators';
import { Repository } from '@adapters/repository';

@Entity('products')
class Product {
  @PrimaryKey()
  id!: number;
  @Column({ type: 'string' })
  name!: string;
  @Column({ type: 'integer' })
  price!: number;
}

describe('Repository CRUD integration', () => {
  let db: Knex;
  let repo: Repository<Product>;

  beforeAll(async () => {
    db = knex({
      client: 'sqlite3',
      connection: { filename: ':memory:' },
      useNullAsDefault: true,
    });
    await db.schema.createTable('products', (t) => {
      t.increments('id').primary();
      t.string('name');
      t.integer('price');
    });
    repo = new Repository(db, Product);
  });

  // ...
});
```

Important patterns:

- **Isolated DB** per suite (often cleared in `beforeEach`).
- **Migrations or `schema.createTable`** in `beforeAll`.
- **`afterAll`** closes the connection (`db.destroy()` / `manager.closeAll()`).

---

## Tests with Bun

The `npm run test:bun` script runs:

```bash
bun test test/unit --tsconfig-override=tsconfig.test.json
```

This means:

- Only **unit tests** are executed with Bun (integration depends on SQLite).
- `tsconfig.test.json` is used so Bun can compile tests properly.

When adding new unit tests, keep them under `test/unit/**` so they are covered by both Jest and Bun.

---

## Writing new tests

When adding new features:

1. **Choose the test type**:
   - Pure logic, no IO → **unit** under `test/unit/...`.
   - Full flow with DB, NestJS or CLI → **integration** under `test/integration/...`.
2. **Use fixtures where appropriate**:
   - Default configs can live under `test/fixtures/**`.
3. **Follow naming patterns**:
   - File names `*.spec.ts` (or `*.test.ts`, as per `jest.config.js`).
4. **Maintain independence**:
   - Always reset shared state (`beforeEach` / `afterEach`).
5. **Ensure coverage**:
   - For larger changes, run `npm run test:coverage` and verify global thresholds still hold.

---

## CI integration

`package.json` already defines suitable scripts for CI:

- `npm test` — Node tests.
- `npm run test:bun` — Bun unit tests.
- `npm run build` — build with `tsup`.

In a typical CI pipeline, you should:

1. Install dependencies (`npm ci`).
2. Run tests (Node + Bun, if desired).
3. Run the build.

The architecture doc (`docs/knex-orm-superset.md` §12 and §13) includes GitHub Actions workflow examples that can be adapted.
