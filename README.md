# knex-orm

> Biblioteca NPM que estende Knex.js com padrão ORM baseado em decorators, mantendo compatibilidade total com a API nativa do Knex.

[![Build](https://img.shields.io/badge/build-tsc-blue)](./package.json)
[![Tests](https://img.shields.io/badge/tests-jest%20%7C%20bun-green)](./package.json)
[![License](https://img.shields.io/badge/license-ISC-yellow)](./package.json)

[English](./docs/README.en.md)

## Índice

- [Sobre](#sobre)
- [Stack](#stack)
- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Executando o projeto](#executando-o-projeto)
  - [Node.js](#nodejs)
  - [Bun](#bun)
- [Testes](#testes)
- [Build](#build)
- [Lint & Format](#lint--format)
- [Estrutura de Pastas](#estrutura-de-pastas)
- [Paths / Aliases TypeScript](#paths--aliases-typescript)
- [Documentação](#documentação)
- [Regras de Commit](#regras-de-commit)
- [Contribuindo](#contribuindo)
- [Licença](#licença)

---

## Sobre

KnexORM Superset adiciona uma camada ORM sobre o Knex.js sem substituí-lo: decorators para entidades, repositórios genéricos, geração de migrations a partir de entidades, multi-connection e integração com NestJS. Funciona em Node.js e Bun.

## Stack

| Camada     | Tecnologia                                       |
| ---------- | ------------------------------------------------ |
| Runtimes   | Node.js ≥18, Bun ≥1.0                            |
| Linguagem  | TypeScript 4.5+                                  |
| Base       | Knex.js                                          |
| Frameworks | NestJS 9–11 (opcional)                           |
| Bancos     | PostgreSQL, MySQL/MySQL2, SQLite3, MSSQL, Oracle |
| Testes     | Jest, Bun test                                   |

## Pré-requisitos

- Node.js ≥18 ou Bun ≥1.0
- npm, yarn, pnpm ou bun

## Instalação

```bash
# Com npm
npm install knex-orm knex reflect-metadata

# Com bun
bun add knex-orm knex reflect-metadata
```

## Configuração

Variáveis de ambiente típicas (para projetos consumidores):

| Variável       | Descrição                       |
| -------------- | ------------------------------- |
| `DB_HOST`      | Host do banco                   |
| `DB_PORT`      | Porta                           |
| `DB_USER`      | Usuário                         |
| `DB_PASSWORD`  | Senha                           |
| `DB_NAME`      | Nome do banco                   |
| `DATABASE_URL` | Connection string (alternativa) |

## Executando o projeto

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

## Testes

```bash
# Jest (Node)
npm test
# ou
npm run test:node

# Bun test
bun test
# ou
npm run test:bun
```

## Build

```bash
npm run build
```

Saída em `dist/` com `.js` e `.d.ts`.

## Lint & Format

```bash
npm run lint        # Verifica código com ESLint
npm run lint:fix    # Corrige automaticamente
npm run format      # Formata com Prettier
npm run format:check # Verifica formatação (CI)
```

## Estrutura de Pastas

```
knex-orm/
├── src/
│   ├── core/           # Decorators, interfaces, metadata, types
│   ├── adapters/       # Knex, migration, repository
│   ├── nestjs/         # Integração NestJS
│   ├── cli/            # CLI knex-orm
│   └── index.ts
├── test/
│   ├── unit/
│   └── integration/
├── docs/
└── package.json
```

## Paths / Aliases TypeScript

| Alias         | Destino            |
| ------------- | ------------------ |
| `@core/*`     | `./src/core/*`     |
| `@adapters/*` | `./src/adapters/*` |
| `@nestjs/*`   | `./src/nestjs/*`   |
| `@cli/*`      | `./src/cli/*`      |
| `@test/*`     | `./test/*`         |

Exemplo de entidade com decorators:

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

## Documentação

| Arquivo                                             | Descrição                                                                                                                                        |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| [knex-orm-superset.md](./docs/knex-orm-superset.md) | Documento de arquitetura completo: visão geral, decorators, GenericRepository, migrations, multi-connection, NestJS, Bun, testes, publicação NPM |
| [DEVELOPMENT.md](./docs/DEVELOPMENT.md)             | Guia de desenvolvimento: TDD, regras (.rules), boas práticas                                                                                     |
| [README.en.md](./docs/README.en.md)                 | README em inglês                                                                                                                                 |
| [COMMITS_RULES.md](./docs/COMMITS_RULES.md)         | Regras de commits convencionais para agentes e humanos                                                                                           |

## Regras de Commit

O projeto usa **Conventional Commits** para mensagens de commit. Todas as mensagens devem ser em **inglês** e **atômicas** (uma intenção lógica por commit).

- Formato: `type(scope): subject` (ex.: `feat(repository): add soft delete`)
- Tipos: `feat`, `fix`, `docs`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`, `security`
- Subject: imperativo, ≤72 caracteres, sem ponto final

Consulte [COMMITS_RULES.md](./docs/COMMITS_RULES.md) para regras completas.

### References

- [Conventional Commits v1.0.0](https://www.conventionalcommits.org/en/v1.0.0/)
- [SemVer](https://semver.org/)
- [7 rules of a great commit message](https://cbea.ms/git-commit/)
- [GitHub Docs best practices](https://docs.github.com/en/contributing/writing-for-github-docs/best-practices-for-github-docs)

## Contribuindo

1. Fork o repositório
2. Crie uma branch (`git checkout -b feat/minha-feature`)
3. Commit suas alterações (`git commit -m 'feat: adiciona X'`)
4. Push para a branch (`git push origin feat/minha-feature`)
5. Abra um Pull Request

## Licença

ISC
