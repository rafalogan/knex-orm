# knx-orm

> NPM library that extends Knex.js with an ORM pattern based on decorators, maintaining full compatibility with Knex's native API.

[![Build](https://img.shields.io/badge/build-tsup-blue)](https://github.com/rafalogan/knex-orm/blob/main/package.json)
[![Tests](https://img.shields.io/badge/tests-jest%20%7C%20bun-green)](https://github.com/rafalogan/knex-orm/blob/main/package.json)
[![License](https://img.shields.io/badge/license-MIT-yellow)](https://github.com/rafalogan/knex-orm/blob/main/LICENSE)

🇧🇷 [Português](https://github.com/rafalogan/knex-orm/blob/main/README.md) &nbsp;|&nbsp; 🇺🇸 English

## Table of Contents

- [About](#about)
- [Stack](#stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [CLI](#cli)
- [Configuration](#configuration)
- [NestJS Integration (Full CRUD)](#nestjs-integration-full-crud)
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
npm install knx-orm knex reflect-metadata

# With bun
bun add knx-orm knex reflect-metadata
```

## CLI

The package exposes two binaries: **`knx`** (shortcut) and `knx-orm` (binary name; npm package is `knx-orm`).

```bash
npx knx migrate:generate --entities=./src/entities
npx knx migrate:run
npx knx connection:init
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

## NestJS Integration (Full CRUD)

knex-orm ships a ready-to-use NestJS module via the `knex-orm/nestjs` sub-path. It follows the `forRoot()` / `forFeature()` pattern familiar from TypeORM/MikroORM.

### Installation

```bash
npm install knx-orm knex reflect-metadata pg   # or mysql2, sqlite3, etc.
```

> `@nestjs/common` and `@nestjs/core` are already peer dependencies of your NestJS project — no need to reinstall them.

### 1. Define the entity

```typescript
// src/users/user.entity.ts
import 'reflect-metadata';
import { Entity, PrimaryKey, Column, CreatedAt, UpdatedAt, SoftDelete } from 'knx-orm';

@Entity('users')
export class User {
  @PrimaryKey()
  id!: number;

  @Column({ type: 'string', nullable: false, unique: true })
  email!: string;

  @Column({ type: 'string', nullable: false })
  name!: string;

  @CreatedAt()
  createdAt!: Date;

  @UpdatedAt()
  updatedAt!: Date;

  @SoftDelete()
  deletedAt?: Date;
}
```

### 2. Register the global module (`AppModule`)

```typescript
// src/app.module.ts
import { Module } from '@nestjs/common';
import { KnexOrmModule } from 'knx-orm/nestjs';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    KnexOrmModule.forRoot({
      default: 'primary',
      connections: {
        primary: {
          client: 'pg',
          connection: {
            host: process.env.DB_HOST,
            port: Number(process.env.DB_PORT ?? 5432),
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
          },
        },
      },
    }),
    UsersModule,
  ],
})
export class AppModule {}
```

### 3. Register repositories in the feature module

```typescript
// src/users/users.module.ts
import { Module } from '@nestjs/common';
import { KnexOrmModule } from 'knx-orm/nestjs';
import { User } from './user.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

@Module({
  imports: [KnexOrmModule.forFeature([User])],
  providers: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}
```

### 4. Service with full CRUD

```typescript
// src/users/users.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from 'knx-orm/nestjs';
import { IRepository } from 'knx-orm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: IRepository<User>,
  ) {}

  // CREATE
  async create(data: Pick<User, 'name' | 'email'>): Promise<User> {
    return this.userRepo.create(data);
  }

  // READ — paginated list
  async findAll(page = 1, limit = 20) {
    return this.userRepo.paginate({ page, limit });
    // Returns: { data: User[], total: number, page: number, lastPage: number }
  }

  // READ — by ID
  async findOne(id: number): Promise<User> {
    const user = await this.userRepo.findById(id);
    if (!user) throw new NotFoundException(`User #${id} not found`);
    return user;
  }

  // READ — by field
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({ email });
  }

  // UPDATE
  async update(id: number, data: Partial<Pick<User, 'name' | 'email'>>): Promise<User> {
    const user = await this.findOne(id); // ensures it exists
    return this.userRepo.update({ id: user.id }, data);
  }

  // SOFT DELETE — uses @SoftDelete on the entity
  async softRemove(id: number): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepo.disable({ id: user.id });
  }

  // HARD DELETE
  async remove(id: number): Promise<void> {
    await this.findOne(id);
    await this.userRepo.delete({ id });
  }
}
```

### 5. REST Controller

```typescript
// src/users/users.controller.ts
import { Controller, Get, Post, Patch, Delete, Param, Body, Query, ParseIntPipe } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './user.entity';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() body: Pick<User, 'name' | 'email'>) {
    return this.usersService.create(body);
  }

  @Get()
  findAll(@Query('page', ParseIntPipe) page = 1, @Query('limit', ParseIntPipe) limit = 20) {
    return this.usersService.findAll(page, limit);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: Partial<Pick<User, 'name' | 'email'>>) {
    return this.usersService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.softRemove(id);
  }
}
```

### 6. Inject raw connection (advanced)

```typescript
import { InjectConnection } from 'knx-orm/nestjs';
import { Knex } from 'knex';

@Injectable()
export class ReportsService {
  constructor(
    @InjectConnection() // default connection
    private readonly knex: Knex,
  ) {}

  async rawReport() {
    return this.knex('users').select('name').count('id as total').groupBy('name');
  }
}
```

### NestJS API summary

| Symbol                      | Imported from    | Description                            |
| --------------------------- | ---------------- | -------------------------------------- |
| `KnexOrmModule`             | `knx-orm/nestjs` | Root module (`forRoot` / `forFeature`) |
| `@InjectRepository(Entity)` | `knx-orm/nestjs` | Injects `IRepository<Entity>`          |
| `@InjectConnection(name?)`  | `knx-orm/nestjs` | Injects the `Knex` instance            |
| `IRepository<T>`            | `knx-orm`        | Generic repository interface           |

---

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

### 🇺🇸 English

| #   | Document                                                                                                                | Description                            |
| --- | ----------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| 01  | [Introduction](https://github.com/rafalogan/knex-orm/blob/main/docs/en/01-introduction.md)                              | What it is, motivation, positioning    |
| 02  | [Architecture](https://github.com/rafalogan/knex-orm/blob/main/docs/en/02-architecture.md)                              | Design, layers, patterns               |
| 03  | [Installation & Get Started](https://github.com/rafalogan/knex-orm/blob/main/docs/en/03-installation-and-getstarted.md) | Step-by-step setup                     |
| 04  | [Usage Guide](https://github.com/rafalogan/knex-orm/blob/main/docs/en/04-usage-guide.md)                                | Decorators, repository, examples       |
| 05  | [API Reference](https://github.com/rafalogan/knex-orm/blob/main/docs/en/05-api-reference.md)                            | Full public API reference              |
| 06  | [Configuration](https://github.com/rafalogan/knex-orm/blob/main/docs/en/06-configuration.md)                            | Connection options, multi-database     |
| 07  | [Testing](https://github.com/rafalogan/knex-orm/blob/main/docs/en/07-testing.md)                                        | How to run and write tests             |
| 08  | [Migrations](https://github.com/rafalogan/knex-orm/blob/main/docs/en/08-migrations.md)                                  | CLI, generating and running migrations |
| 09  | [Contributing](https://github.com/rafalogan/knex-orm/blob/main/docs/en/09-contributing.md)                              | Contribution flow, TDD, rules          |
| 10  | [Changelog](https://github.com/rafalogan/knex-orm/blob/main/docs/en/10-changelog.md)                                    | Version history                        |

### 🇧🇷 Português

| #   | Documento                                                                                                         | Descrição                             |
| --- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| 01  | [Introdução](https://github.com/rafalogan/knex-orm/blob/main/docs/pt/01-introducao.md)                            | O que é, motivação, posicionamento    |
| 02  | [Arquitetura](https://github.com/rafalogan/knex-orm/blob/main/docs/pt/02-arquitetura.md)                          | Design, camadas, padrões              |
| 03  | [Instalação & Get Started](https://github.com/rafalogan/knex-orm/blob/main/docs/pt/03-instalacao-e-getstarted.md) | Setup passo a passo                   |
| 04  | [Guia de uso](https://github.com/rafalogan/knex-orm/blob/main/docs/pt/04-guia-de-uso.md)                          | Decorators, repositório, exemplos     |
| 05  | [API Reference](https://github.com/rafalogan/knex-orm/blob/main/docs/pt/05-api-reference.md)                      | Referência completa das APIs públicas |
| 06  | [Configuração](https://github.com/rafalogan/knex-orm/blob/main/docs/pt/06-configuracao.md)                        | Opções de conexão, multi-banco        |
| 07  | [Testes](https://github.com/rafalogan/knex-orm/blob/main/docs/pt/07-testes.md)                                    | Como rodar e escrever testes          |
| 08  | [Migrações](https://github.com/rafalogan/knex-orm/blob/main/docs/pt/08-migracoes.md)                              | CLI, geração e execução de migrations |
| 09  | [Contribuindo](https://github.com/rafalogan/knex-orm/blob/main/docs/pt/09-contribuindo.md)                        | Fluxo de contribuição, TDD, regras    |
| 10  | [Changelog](https://github.com/rafalogan/knex-orm/blob/main/docs/pt/10-changelog.md)                              | Histórico de versões                  |

### Internal reference

| File                                                                                              | Description                                                                                                                             |
| ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| [knex-orm-superset.md](https://github.com/rafalogan/knex-orm/blob/main/docs/knex-orm-superset.md) | Full architecture document: overview, decorators, GenericRepository, migrations, multi-connection, NestJS, Bun, testing, NPM publishing |
| [DEVELOPMENT.md](https://github.com/rafalogan/knex-orm/blob/main/docs/DEVELOPMENT.md)             | Development guide: TDD, rules (.rules), best practices                                                                                  |
| [COMMITS_RULES.md](https://github.com/rafalogan/knex-orm/blob/main/docs/COMMITS_RULES.md)         | Conventional commit rules for agents and humans                                                                                         |

## Commit Rules

The project uses **Conventional Commits** for commit messages. All messages must be in **English** and **atomic** (one logical intention per commit).

- Format: `type(scope): subject` (e.g. `feat(repository): add soft delete`)
- Types: `feat`, `fix`, `docs`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`, `security`
- Subject: imperative mood, ≤72 chars, no trailing period

See [COMMITS_RULES.md](https://github.com/rafalogan/knex-orm/blob/main/docs/COMMITS_RULES.md) for full rules.

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

MIT — see [LICENSE](https://github.com/rafalogan/knex-orm/blob/main/LICENSE) for the full text.
