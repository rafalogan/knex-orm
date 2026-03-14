# knex-orm

> NPM library that extends Knex.js with an ORM pattern based on decorators, maintaining full compatibility with Knex's native API.

[![Build](https://img.shields.io/badge/build-tsc-blue)](../package.json)
[![Tests](https://img.shields.io/badge/tests-jest%20%7C%20bun-green)](../package.json)
[![License](https://img.shields.io/badge/license-ISC-yellow)](../package.json)

[Português](../README.md)

## Table of Contents

- [About](#about)
- [Stack](#stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [CLI](#cli)
- [Configuration](#configuration)
- [Running the Project](#running-the-project)
  - [Node.js](#nodejs)
  - [Bun](#bun)
- [Test](#test)
- [Build](#build)
- [Lint & Format](#lint--format)
- [Folder Structure](#folder-structure)
- [TypeScript Paths / Aliases](#typescript-paths--aliases)
- [Documentation](#documentation)
- [Commit Rules](#commit-rules)
- [Contributing](#contributing)
- [License](#license)

---

## About

KnexORM Superset adds an ORM layer on top of Knex.js without replacing it: decorators for entities, generic repositories, migration generation from entities, multi-connection and NestJS integration. Works on Node.js and Bun.

## Stack

| Layer      | Technology                                       |
| ---------- | ------------------------------------------------ |
| Runtimes   | Node.js ≥18, Bun ≥1.0                            |
| Language   | TypeScript 4.5+                                  |
| Base       | Knex.js                                          |
| Frameworks | NestJS 9–11 (optional)                           |
| Databases  | PostgreSQL, MySQL/MySQL2, SQLite3, MSSQL, Oracle |
| Testing    | Jest, Bun test                                   |

## Prerequisites

- Node.js ≥18 or Bun ≥1.0
- npm, yarn, pnpm or bun

## Installation

```bash
# With npm
npm install knex-orm knex reflect-metadata

# With bun
bun add knex-orm knex reflect-metadata
```

## CLI

The package exposes two binaries: **`kor`** (shortcut) and `knex-orm`.

```bash
npx kor migrate:generate --entities=./src/entities
npx kor migrate:run
npx kor connection:init
```

## Configuration

Typical environment variables (for consumer projects):

| Variable       | Description                     |
| -------------- | ------------------------------- |
| `DB_HOST`      | Database host                   |
| `DB_PORT`      | Port                            |
| `DB_USER`      | User                            |
| `DB_PASSWORD`  | Password                        |
| `DB_NAME`      | Database name                   |
| `DATABASE_URL` | Connection string (alternative) |

## Running the Project

### Node.js

```bash
npm run build
node dist/index.js
```

### Bun

```bash
bun run build
bun run dist/index.js
```

## Test

```bash
# Jest (Node)
npm test
# or
npm run test:node

# Bun test
bun test
# or
npm run test:bun
```

## Build

```bash
npm run build
```

Output in `dist/` with `.js` and `.d.ts`.

## Lint & Format

```bash
npm run lint        # Run ESLint
npm run lint:fix    # Fix automatically
npm run format      # Format with Prettier
npm run format:check # Check formatting (CI)
```

## Folder Structure

```
knex-orm/
├── src/
│   ├── core/           # Decorators, interfaces, metadata, types
│   ├── adapters/       # Knex, migration, repository
│   ├── nestjs/         # NestJS integration
│   ├── cli/            # kor / knex-orm
│   └── index.ts
├── test/
│   ├── unit/
│   └── integration/
├── docs/
└── package.json
```

## TypeScript Paths / Aliases

| Alias         | Target             |
| ------------- | ------------------ |
| `@core/*`     | `./src/core/*`     |
| `@adapters/*` | `./src/adapters/*` |
| `@nestjs/*`   | `./src/nestjs/*`   |
| `@cli/*`      | `./src/cli/*`      |
| `@test/*`     | `./test/*`         |

Example entity with decorators:

```typescript
import { Entity, PrimaryKey, Column, CreatedAt, UpdatedAt, SoftDelete, Index } from '@core/decorators';

@Entity('users')
@Index(['email', 'tenant_id'])
export class User {
  @PrimaryKey()
  id!: number;

  @Column({ type: 'string', nullable: false, unique: true })
  email!: string;

  @Column({ type: 'string' })
  name!: string;

  @CreatedAt()
  createdAt!: Date;

  @UpdatedAt()
  updatedAt!: Date;

  @SoftDelete()
  deletedAt?: Date;
}
```

## Documentation

| File                                           | Description                                                                                                                             |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| [knex-orm-superset.md](./knex-orm-superset.md) | Full architecture document: overview, decorators, GenericRepository, migrations, multi-connection, NestJS, Bun, testing, NPM publishing |
| [DEVELOPMENT.md](./DEVELOPMENT.md)             | Development guide: TDD, rules (.rules), best practices                                                                                  |
| [README.md](../README.md)                      | README in Portuguese                                                                                                                    |
| [COMMITS_RULES.md](./COMMITS_RULES.md)         | Conventional commit rules for agents and humans                                                                                         |

## Commit Rules

The project uses **Conventional Commits** for commit messages. All messages must be in **English** and **atomic** (one logical intention per commit).

- Format: `type(scope): subject` (e.g. `feat(repository): add soft delete`)
- Types: `feat`, `fix`, `docs`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`, `security`
- Subject: imperative mood, ≤72 chars, no trailing period

See [COMMITS_RULES.md](./COMMITS_RULES.md) for full rules.

### References

- [Conventional Commits v1.0.0](https://www.conventionalcommits.org/en/v1.0.0/)
- [SemVer](https://semver.org/)
- [7 rules of a great commit message](https://cbea.ms/git-commit/)
- [GitHub Docs best practices](https://docs.github.com/en/contributing/writing-for-github-docs/best-practices-for-github-docs)

## Contributing

1. Fork the repository
2. Create a branch (`git checkout -b feat/my-feature`)
3. Commit your changes (`git commit -m 'feat: add X'`)
4. Push to the branch (`git push origin feat/my-feature`)
5. Open a Pull Request

## License

ISC
