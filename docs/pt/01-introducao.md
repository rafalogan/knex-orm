## Introdução

O **knex-orm** é uma biblioteca NPM que estende o **Knex.js** com um padrão de ORM baseado em decorators, mantendo compatibilidade total com a API nativa do Knex.  
Em vez de substituir o Knex, ele adiciona:

- **Entidades com decorators** (`@Entity`, `@Column`, `@PrimaryKey`, etc.)
- **Repositório genérico tipado** (`Repository<T>`) para CRUD, paginação e filtros
- **Geração de migrations** a partir de entidades (usando o próprio Knex)
- **Integração com NestJS** via `KnexOrmModule`
- **Suporte a Node.js e Bun** com a mesma API (`isBun`, `isNode`, `getRuntime`)

Essa abordagem permite que projetos que já usam Knex adotem convenções de ORM sem trocar de stack nem perder acesso ao poder do query builder.

---

## Problema que resolve

O Knex oferece um ótimo query builder, mas não fornece:

- Mapeamento objeto–relacional com classes TypeScript
- Convenções de timestamps e soft delete
- Repositórios genéricos tipados
- Migrations derivadas de entidades
- Integração de primeira classe com NestJS

O knex-orm cobre exatamente esse espaço:

- Mantém o Knex como engine principal
- Fornece decorators que descrevem o schema
- Usa metadata para gerar migrations e mapear linhas do banco para entidades
- Expõe um repositório genérico simples de usar e fácil de testar

---

## Comparativo com alternativas

Resumo de posicionamento em relação a ORMs conhecidos:

| Aspecto        | knex-orm                                    | TypeORM                             | Prisma                | MikroORM             |
| -------------- | ------------------------------------------- | ----------------------------------- | --------------------- | -------------------- |
| Base           | Knex.js (query builder)                     | Próprio driver                      | Prisma Client         | Próprio driver       |
| Definição      | Decorators em classes TS                    | Decorators                          | `.prisma` declarativo | Decorators           |
| Migrations     | Geração a partir de entidades + Knex nativo | Sincronização ou migrations manuais | `prisma migrate`      | Migrations manuais   |
| SQL raw        | Usa diretamente `knex(...)`                 | `QueryRunner`                       | Limitado              | API própria          |
| Multi‑DB       | Via Knex (PG, MySQL, SQLite, MSSQL, Oracle) | Nativo                              | Nativo                | Nativo               |
| NestJS         | Módulo dedicado (`KnexOrmModule`)           | Módulo oficial                      | Módulo oficial        | Módulo oficial       |

**Diferencial principal:** para quem já usa Knex, a migração é incremental — é possível continuar escrevendo queries com `knex('tabela')...` onde fizer sentido, e usar o ORM onde traz mais produtividade.

---

## Stack e compatibilidade

Com base em `package.json`, `tsconfig.json` e `docs/knex-orm-superset.md`:

- **Runtimes**: Node.js ≥ 18, Bun ≥ 1.0
- **Linguagem**: TypeScript (strict, `experimentalDecorators`, `emitDecoratorMetadata`)
- **Base**: Knex.js
- **Framework opcional**: NestJS (9, 10 e 11)
- **Bancos suportados** (via Knex):
  - PostgreSQL
  - MySQL / MySQL2
  - SQLite3 (Node)
  - MSSQL
  - Oracle

Para Bun, drivers baseados em native addons (como `sqlite3`) não são suportados; use preferencialmente PostgreSQL ou MySQL em Bun.

---

## Casos de uso típicos

- **Aplicações Node.js “vanilla”**
  - Scripts e serviços que precisam de um ORM leve, sem framework
  - Repositórios genéricos simples de testar (ver testes de integração em `test/integration/node-vanilla`)
- **APIs REST/GraphQL com NestJS**
  - Módulo `KnexOrmModule` com `forRoot`/`forFeature`
  - Injeção de `IRepository<Entity>` com `@InjectRepository`
  - Uso de `@InjectConnection` quando acesso Knex direto for necessário
- **Ferramentas CLI e pipelines**
  - Uso do binário `kor`/`knex-orm` para gerar e executar migrations
  - Execução em CI usando Node ou Bun

---

## Status do projeto

Conforme `docs/knex-orm-superset.md` e `AUDIT.md`:

- **Estado atual (1.x)**:
  - Decorators principais implementados (`@Entity`, `@Column`, `@PrimaryKey`, `@CreatedAt`, `@UpdatedAt`, `@SoftDelete`, `@Index`)
  - Repositório genérico (`Repository<T>`) com CRUD, paginação, filtros e transações
  - Geração de migrations a partir de entidades (`MigrationEngine`, `SchemaDiff`, `SchemaRegistry`, `MigrationGenerator`, `MigrationWriter`)
  - CLI com comandos `migrate:generate`, `migrate:run`, `migrate:rollback`, `connection:init`, `connection:test`, `connection:list`
  - Integração NestJS (`KnexOrmModule`, `@InjectRepository`, `@InjectConnection`)
  - Suporte a Node.js e Bun (detecção de runtime em `src/core/runtime.ts`)
- **Roadmap 1.x**:
  - Relations (`@OneToMany`, `@ManyToOne`, `@ManyToMany`)
  - Query builder fluente tipado sobre o repositório
  - Transações avançadas e unidade de trabalho
- **Roadmap 2.x**:
  - Schema validation em runtime
  - Auto‑migrate em desenvolvimento
  - Sistema de plugins

Sempre consulte `docs/knex-orm-superset.md` e o `CHANGELOG` para o estado exato da versão instalada.

---

## Licença

O projeto é distribuído sob a licença **MIT** (ver arquivo `LICENSE` na raiz). Isso permite uso em projetos open‑source e proprietários, inclusive em ambiente corporativo, desde que a licença seja preservada.

