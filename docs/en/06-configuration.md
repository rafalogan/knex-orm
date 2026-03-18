## Overview

This section explains how to configure connections and environments for knx-orm, based on:

- `docs/knex-orm-superset.md` (section 6)
- Types and implementations in `src/adapters/connection`
- CLI scripts defined in `package.json`

---

## Config file (`orm.config.js`)

The configuration format is described by the `OrmConfig` type, exported from `src/index.ts`.  
A typical example:

```javascript
/** @type {import('knx-orm').OrmConfig} */
module.exports = {
  default: 'primary',
  connections: {
    primary: {
      client: 'postgresql',
      connection: {
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
      },
      pool: { min: 0, max: 10 },
    },
  },
};
```

This object is consumed by `KnexORM.initialize` / `KnexORM.initializeFromPath` and by the CLI connection commands.

---

## Multiple environments

You can organize configuration by environment (`development`, `test`, `production`), keeping the `OrmConfig` shape for each key, as shown in the superset doc:

```javascript
module.exports = {
  development: {
    default: 'primary',
    connections: {
      primary: {
        client: 'sqlite3',
        connection: { filename: ':memory:' },
      },
    },
  },
  test: {
    default: 'primary',
    connections: {
      primary: {
        client: 'sqlite3',
        connection: { filename: ':memory:' },
      },
    },
  },
  production: {
    default: 'primary',
    connections: {
      primary: {
        client: 'postgresql',
        connection: {
          host: process.env.DB_HOST,
          user: process.env.DB_USER,
          password: process.env.DB_PASSWORD,
          database: process.env.DB_NAME,
        },
        pool: { min: 2, max: 10 },
      },
    },
  },
};
```

The active environment is typically selected using `NODE_ENV`.

---

## Supported databases and drivers

knx-orm delegates all DB communication to **Knex**.  
Database drivers must be added in the **consumer** project.

Summary table (from superset §6.3 and §13.2):

| Database   | Recommended driver | Node.js | Bun  |
| ---------- | ------------------ | ------- | ---- |
| PostgreSQL | `pg`               | ✅      | ✅   |
| MySQL      | `mysql2`           | ✅      | ✅   |
| SQLite     | `sqlite3`          | ✅      | ⚠️   |
| MSSQL      | `mssql`            | ✅      | ⚠️\* |
| Oracle     | `oracledb`         | ✅      | ⚠️\* |

⚠️ On Bun, native‑addon drivers (`node-gyp`) often don’t work; check the driver/Knex docs before using in production.

---

## Environment variables

Typical variables used in `orm.config.js`:

| Variable       | Description                     |
| -------------- | ------------------------------- |
| `DB_HOST`      | Database host                   |
| `DB_PORT`      | Port                            |
| `DB_USER`      | User                            |
| `DB_PASSWORD`  | Password                        |
| `DB_NAME`      | Database name                   |
| `DATABASE_URL` | Connection string (alternative) |

The superset doc also suggests a `getEnv` abstraction (exported from `src/core/runtime.ts`) to deal with Node and Bun:

```typescript
import { getEnv } from 'knx-orm';

const host = getEnv('DB_HOST') ?? 'localhost';
```

On Bun, both `process.env` and `Bun.env` are available; on Node, use `dotenv` or similar to load `.env`.

---

## Connection registry

Internally, the connection module (`src/adapters/connection`) uses:

- `ConnectionConfigLoader` — reads and validates the config file
- `ConnectionFactory` — creates Knex instances from a `ConnectionEntry`
- `ConnectionRegistry` — registers connections by name
- `ConnectionManager` — orchestrates connection initialization and shutdown

From a user perspective, you interact with this via `KnexORM`:

```typescript
import { KnexORM } from 'knx-orm';

const orm = await KnexORM.initializeFromPath(); // or initialize(config)

// Default connection (name in OrmConfig.default)
const defaultKnex = orm.getDefaultConnection();

// Named connection
const analyticsKnex = orm.getConnection('analytics');
```

These APIs use `ConnectionManager`, exported in `src/index.ts`, under the hood.

---

## Connection pooling

For production environments, configure the pool explicitly in each `ConnectionEntry`:

```javascript
{
  client: 'postgresql',
  connection: {
    host: process.env.DB_HOST,
    // ...
  },
  pool: {
    min: 2,
    max: 10,
  },
}
```

Exact values for `min` and `max` depend on your application load and DB limits.  
Check Knex and driver documentation for concrete recommendations.

---

## Configuration best practices

- **Separate environments**: use distinct configs for development, test and production.
- **Don’t commit secrets**: use environment variables or a secret management service.
- **Use `redactConnectionConfig` when logging configs**: never log plain passwords or full connection strings.
- **Keep `OrmConfig` simple**: move conditional logic (e.g. driver choice by runtime) into TypeScript code when needed.
