## knx-orm

> Biblioteca NPM que estende Knex.js com padrão ORM baseado em decorators, mantendo compatibilidade total com a API nativa do Knex.

[![Build](https://img.shields.io/badge/build-tsup-blue)](https://github.com/rafalogan/knex-orm/blob/main/package.json)
[![Tests](https://img.shields.io/badge/tests-jest%20%7C%20bun-green)](https://github.com/rafalogan/knex-orm/blob/main/package.json)
[![License](https://img.shields.io/badge/license-MIT-yellow)](https://github.com/rafalogan/knex-orm/blob/main/LICENSE)

🇧🇷 Português &nbsp;|&nbsp; 🇺🇸 [English](https://github.com/rafalogan/knex-orm/blob/main/docs/README.en.md)

---

## Visão rápida

- **O que é**: camada ORM leve sobre o Knex.js com decorators, repositório genérico, migrations geradas a partir de entidades e integração com NestJS.
- **Por que usar**: mantém todo o poder do Knex, adicionando organização, tipagem e convenções típicas de ORMs modernos.
- **Compatibilidade**:
  - Runtimes: **Node.js ≥ 18**, **Bun ≥ 1.0**
  - Framework opcional: **NestJS 9–11**
  - Bancos (via Knex): PostgreSQL, MySQL/MySQL2, SQLite3 (Node), MSSQL, Oracle

---

## Instalação em 1 comando

```bash
npm install knx-orm knex reflect-metadata
```

Ou com Bun:

```bash
bun add knx-orm knex reflect-metadata
```

> Observação: para SQLite, adicione também o driver (`sqlite3`) no projeto consumidor.

---

## Exemplo mínimo (≤ 15 linhas)

Exemplo Node.js “vanilla” usando SQLite in‑memory (inspirado nos testes de integração do repositório):

```typescript
import 'reflect-metadata';
import { KnexORM, Entity, PrimaryKey, Column } from 'knx-orm';

@Entity('users')
class User {
  @PrimaryKey() id!: number;
  @Column({ type: 'string' }) name!: string;
}

async function main() {
  const orm = await KnexORM.initialize({
    default: 'primary',
    connections: { primary: { client: 'sqlite3', connection: { filename: ':memory:' } } },
  });
  const repo = orm.getRepository(User);
  await repo.create({ name: 'Alice' });
  console.log(await repo.find({}));
  await orm.close();
}
main().catch(console.error);
```

---

## Documentação completa

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

### Referência interna

| Documento                                                                                         | Descrição                                                                                                                             |
| ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| [knex-orm-superset.md](https://github.com/rafalogan/knex-orm/blob/main/docs/knex-orm-superset.md) | Documento mestre de arquitetura: visão geral, decorators, repositório, migrations, multi-conexão, NestJS, Bun, testes, publicação NPM |
| [DEVELOPMENT.md](https://github.com/rafalogan/knex-orm/blob/main/docs/DEVELOPMENT.md)             | Guia de desenvolvimento: TDD, regras (.rules), boas práticas                                                                          |
| [COMMITS_RULES.md](https://github.com/rafalogan/knex-orm/blob/main/docs/COMMITS_RULES.md)         | Regras de commit convencional para agentes e humanos                                                                                  |

---

## CLI (visão rápida)

O pacote exporta dois binários, definidos em `package.json`:

- `knx` (atalho recomendado)
- `knx-orm` (binário exposto pelo pacote `knx-orm`)

Comandos principais (com detecção automática de estrutura via Project Introspection Layer):

```bash
npx knx migrate:generate              # entities → migrations (CONFIG → CONVENTION → FLAGS)
npx knx migrate:generate --entities=./dist/entities --migrations-dir=./migrations
npx knx migrate:run
npx knx migrate:rollback
npx knx connection:init
npx knx connection:test
npx knx connection:list

# fluxo inverso (migrations → entidades)
npx knx entity:generate               # detecta migrations/entities por CONFIG → CONVENTION
```

Detalhes completos em [`docs/pt/08-migracoes.md`](https://github.com/rafalogan/knex-orm/blob/main/docs/pt/08-migracoes.md).

---

## Compatibilidade

- **Node.js**: ≥ 18
- **Bun**: ≥ 1.0
- **NestJS**: 9, 10, 11 (submódulo `knex-orm/nestjs`)
- **Bancos**: PostgreSQL, MySQL/MySQL2, SQLite3 (Node), MSSQL, Oracle

Para Bun, evite SQLite (drivers nativos); use PostgreSQL ou MySQL.

---

## Integração com NestJS (CRUD completo)

O pacote `knx-orm` expõe um módulo NestJS pronto para uso via `knx-orm/nestjs`. Ele segue o padrão `forRoot()` / `forFeature()` familiar do TypeORM/MikroORM.

### Instalação

```bash
npm install knx-orm knex reflect-metadata pg   # ou mysql2, sqlite3 etc.
```

> `@nestjs/common` e `@nestjs/core` já são peer dependencies do seu projeto NestJS — não precisam ser instalados novamente.

### 1. Definir a entidade

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

### 2. Registrar o módulo global (`AppModule`)

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

### 3. Registrar repositórios no módulo de feature

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

### 4. Service com CRUD completo

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

  // READ — lista com paginação
  async findAll(page = 1, limit = 20) {
    return this.userRepo.paginate({ page, limit });
    // Retorna: { data: User[], total: number, page: number, lastPage: number }
  }

  // READ — por ID
  async findOne(id: number): Promise<User> {
    const user = await this.userRepo.findById(id);
    if (!user) throw new NotFoundException(`User #${id} not found`);
    return user;
  }

  // READ — busca por campo
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({ email });
  }

  // UPDATE
  async update(id: number, data: Partial<Pick<User, 'name' | 'email'>>): Promise<User> {
    const user = await this.findOne(id); // garante que existe
    return this.userRepo.update({ id: user.id }, data);
  }

  // DELETE (soft delete — usa @SoftDelete na entidade)
  async softRemove(id: number): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepo.disable({ id: user.id });
  }

  // DELETE físico
  async remove(id: number): Promise<void> {
    await this.findOne(id);
    await this.userRepo.delete({ id });
  }
}
```

### 5. Controller REST

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

### 6. Injetar a conexão bruta (avançado)

```typescript
import { InjectConnection } from 'knx-orm/nestjs';
import { Knex } from 'knex';

@Injectable()
export class ReportsService {
  constructor(
    @InjectConnection() // conexão padrão
    private readonly knex: Knex,
  ) {}

  async rawReport() {
    return this.knex('users').select('name').count('id as total').groupBy('name');
  }
}
```

### Resumo das APIs NestJS

| Símbolo                     | Importado de     | Descrição                                   |
| --------------------------- | ---------------- | ------------------------------------------- |
| `KnexOrmModule`             | `knx-orm/nestjs` | Módulo principal (`forRoot` / `forFeature`) |
| `@InjectRepository(Entity)` | `knx-orm/nestjs` | Injeta `IRepository<Entity>`                |
| `@InjectConnection(name?)`  | `knx-orm/nestjs` | Injeta a instância `Knex`                   |
| `IRepository<T>`            | `knx-orm`        | Interface do repositório genérico           |

---

## Scripts principais

Do `package.json`:

- **Build**: `npm run build` (usa `tsup`, saída em `dist/` com ESM + CJS + `.d.ts`)
- **Testes**:
  - `npm test` / `npm run test:node` — Jest (Node)
  - `npm run test:coverage` — Jest com coverage
  - `npm run test:bun` — Bun test (unitários)
- **Qualidade**:
  - `npm run lint`, `npm run lint:fix`
  - `npm run format`, `npm run format:check`

---

## Contribuindo

- Leia primeiro:
  - `.rules`
  - [`docs/DEVELOPMENT.md`](https://github.com/rafalogan/knex-orm/blob/main/docs/DEVELOPMENT.md)
  - [`docs/COMMITS_RULES.md`](https://github.com/rafalogan/knex-orm/blob/main/docs/COMMITS_RULES.md)
  - [`docs/pt/09-contribuindo.md`](https://github.com/rafalogan/knex-orm/blob/main/docs/pt/09-contribuindo.md)
- Resumo do fluxo:
  1. Fork → branch (`feat/...`)
  2. TDD (teste primeiro)
  3. `npm test` + `npm run test:bun` + `npm run lint`
  4. Commits em formato **Conventional Commits** (em inglês)
  5. Abra um Pull Request

---

## Licença

Este projeto é licenciado sob **MIT**. Consulte [`LICENSE`](https://github.com/rafalogan/knex-orm/blob/main/LICENSE) para o texto completo.
