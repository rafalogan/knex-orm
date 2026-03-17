## Política de versionamento

O knex-orm segue:

- **Semantic Versioning (SemVer)** — `MAJOR.MINOR.PATCH`
- **Conventional Commits** — para geração e leitura de changelogs

Em linhas gerais:

- `MAJOR` — mudanças incompatíveis (breaking changes)
- `MINOR` — novas funcionalidades compatíveis
- `PATCH` — correções de bugs e pequenos ajustes compatíveis

Commits do tipo `feat` tendem a gerar entradas de `MINOR`, `fix` gera `PATCH`, e commits com `BREAKING CHANGE:` podem gerar novos `MAJOR`.

---

## Guideline para manter o CHANGELOG

Como regra prática:

- Mantenha este arquivo sempre em sincronia com a versão em `package.json`.
- Para cada release:
  - Adicione uma nova seção com o número da versão e a data.
  - Liste mudanças de alto nível, não cada commit isolado.
  - Agrupe por tipo: “Added”, “Changed”, “Fixed”, “Removed”, quando fizer sentido.

Ferramentas automáticas baseadas em Conventional Commits podem ser usadas para gerar o conteúdo inicial, que depois pode ser refinado manualmente.

---

## Histórico

> Nota: esta seção deve ser atualizada à medida que novas versões forem publicadas.  
> Os itens abaixo são apenas um esqueleto inicial baseado na arquitetura descrita em `docs/knex-orm-superset.md`.  
> Ajuste os detalhes conforme o histórico real de releases do projeto.

### 1.0.0 — Primeira versão estável

- **Added**
  - Decorators básicos: `@Entity`, `@Column`, `@PrimaryKey`, `@CreatedAt`, `@UpdatedAt`, `@SoftDelete`, `@Index`.
  - Repositório genérico `Repository<T>` com:
    - `create`, `createMany`, `save`, `find`, `findOne`, `findById`
    - `update`, `updateMany`, `delete`, `deleteMany`, `disable`
    - `paginate`, `transaction`, `raw`
  - Engine de migrations:
    - `MigrationEngine`, `SchemaBuilder`, `SchemaDiff`, `SchemaRegistry`, `MigrationGenerator`, `MigrationWriter`
    - Arquivo `.orm-schema.json` para rastrear o schema
  - CLI (`kor` / `knex-orm`):
    - `migrate:generate`, `migrate:run`, `migrate:rollback`
    - `connection:init`, `connection:test`, `connection:list`
  - Integração Node.js “vanilla” via `KnexORM.initialize` / `initializeFromPath`.
  - Integração NestJS:
    - `KnexOrmModule`, `forRoot`, `forFeature`
    - `@InjectRepository`, `@InjectConnection`
  - Suporte a Node.js ≥ 18 e Bun ≥ 1.0 (detecção de runtime em `src/core/runtime.ts`).
  - Utilitários de segurança:
    - `isValidSqlIdentifier`
    - `redactConnectionConfig`

---

## Próximas versões (roadmap)

As ideias abaixo vêm do roadmap descrito em `docs/knex-orm-superset.md`. Elas indicam direções futuras, não releases agendadas:

- **1.x**
  - Suporte a relações (`@OneToMany`, `@ManyToOne`, `@ManyToMany`).
  - Query builder tipado na camada de repositório.
  - Transações de alto nível (`orm.transaction(...)`) e unidade de trabalho.
- **2.x**
  - Validação de schema em runtime.
  - Auto‑migrate para ambientes de desenvolvimento.
  - Sistema de plugins (auditoria, multi‑tenant, etc.).

Consulte o repositório (tags e releases) para o histórico real de versões e datas.

