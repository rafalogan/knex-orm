## Visão geral

O knx-orm gera e executa migrations usando o próprio **Knex** como engine.  
Por cima disso, a lib oferece:

- **Diff de schema** baseado em metadata de entidades
- **Arquivo de estado** (`.orm-schema.json`) para rastrear o schema anterior
- **CLI** (`knx`/`knx-orm`) com comandos de geração e execução

Toda a lógica é implementada em `src/adapters/migration` e descrita em `docs/knex-orm-superset.md` (§5).

---

## Fluxo de geração de migrations

O fluxo de `migrate:generate` é:

1. O CLI carrega as entidades compiladas (normalmente a partir de `dist/`).
2. O `EntityScanner` lê metadata registrada pelos decorators.
3. O `SchemaRegistry` lê o snapshot anterior de schema em `.orm-schema.json` (se existir).
4. O `SchemaDiff` compara:
   - **Entidades atuais** vs **schema anterior** (não contra o banco).
5. São geradas operações (`MigrationOp`) como `createTable`, `addColumn`, `addIndex`, etc.
6. O `MigrationGenerator` transforma essas operações em código Knex.
7. O `MigrationWriter` grava arquivos de migration em disco.
8. O `SchemaRegistry` persiste o novo snapshot em `.orm-schema.json`.

Ponto importante: o diff **não** é feito contra o schema real do banco, e sim contra o último estado conhecido em `.orm-schema.json`.

---

## Operações de diff suportadas

Com base em `SchemaDiff` e no superset:

- `createTable` — cria uma nova tabela
- `dropTable` — remove uma tabela
- `addColumn` — adiciona coluna
- `dropColumn` — remove coluna
- `addIndex` — cria índices (PK, unique, `@Index`, `@Column({ index: true })`)
- `dropIndex` — remove índices
- `alterColumn` — detectada, mas frequentemente implementada como comentário/TODO, pois depende do banco

Ao gerar a migration, o `MigrationGenerator` traduz essas operações para chamadas do Knex Schema Builder.

---

## Arquivo `.orm-schema.json`

O arquivo `.orm-schema.json` é usado para:

- Armazenar o **estado anterior** do schema (tabelas, colunas, índices).
- Permitir que o diff seja calculado apenas com base em entidades, sem consultar o banco.

Propriedades de alto nível (tipos exatos em `OrmSchema`, exportado por `src/index.ts`):

```typescript
interface OrmSchema {
  version: number;
  tables: Record<
    string,
    {
      columns: Record<string, unknown>;
      indexes?: Record<string, unknown>;
    }
  >;
}
```

Você não deve editar esse arquivo manualmente; ele é mantido pelo CLI.

---

## Comandos do CLI

Os scripts em `package.json` apontam para o binário principal:

```json
"bin": {
  "knx": "./dist/cli/migrate-generate.js",
  "knx-orm": "./dist/cli/migrate-generate.js"
}
```

Os comandos expostos (conforme `docs/knex-orm-superset.md` e `AUDIT.md`) são:

### `migrate:generate` — entidades → migrations

O comando `migrate:generate` usa a **Project Introspection Layer** do CLI para detectar automaticamente a estrutura do projeto:

```bash
npx knx migrate:generate
```

Ordem de resolução dos paths:

1. **CONFIG**: lê `knexfile.*` / `knex.config.*` e usa `entitiesDir` / `migrationsDir` quando presentes.
2. **CONVENTION**: se não houver config, tenta diretórios padrão:
   - Entities: `./dist/entities`, `./src/entities`, `./entities`
   - Migrations: `./migrations`, `./dist/migrations`, `./src/migrations`
3. **CLI FLAGS (override)**: se flags forem passadas, elas têm prioridade.

Exemplo com override explícito:

```bash
npx knx migrate:generate --entities=./dist/entities --migrations-dir=./migrations
```

Parâmetros suportados:

- `--entities` — diretório (ou arquivo) de onde as entidades compiladas são importadas.
- `--migrations-dir` — pasta onde as migrations serão geradas.
- `--config` — caminho opcional para arquivo de configuração (`orm.config.js`/`knexfile`), quando usado em conjunto com execução.

### `entity:generate` — migrations → entidades

O comando `entity:generate` executa o fluxo **inverso**: lê migrations Knex existentes e gera classes de entidade com decorators do `knx-orm`.

```bash
npx knx entity:generate
```

A ordem de resolução é a mesma de `migrate:generate`:

1. **CONFIG**: procura `orm.config.js`, `knexfile.*` ou `knex.config.*` e usa `migrationsDir` / diretório de entidades configurados quando existirem.
2. **CONVENTION**: se não houver config, cai em:
   - Migrations: `./migrations`, `./dist/migrations`, `./src/migrations`
   - Entities: `./dist/entities`, `./src/entities`, `./entities`
3. **CLI FLAGS (futuro)**: o comando já foi desenhado para, em versões futuras, aceitar overrides de diretórios, espelhando `migrate:generate`.

As entidades geradas:

- Usam decorators `@Entity`, `@PrimaryKey`, `@Column`, `@CreatedAt`, `@UpdatedAt` e `@SoftDelete` sempre que possível.
- Derivam o nome da classe a partir do nome da tabela (ex.: `users` → `User`).
- Fazem o mapeamento de tipos SQL → tipos TypeScript (`string`, `number`, `boolean`, `Date`) seguindo as regras de `ColumnType`.

### `migrate:run`

```bash
npx knx migrate:run
```

Executa `knex.migrate.latest()` usando a configuração encontrada (`orm.config.js`, `knexfile`, etc.).  
Há também scripts equivalentes em `package.json` para uso direto com Node:

```bash
npm run migrate:run
```

### `migrate:rollback`

```bash
npx knx migrate:rollback
```

Executa `knex.migrate.rollback()` com a mesma fonte de configuração.

### Comandos de conexão

- `knx connection:init` — cria um `orm.config.js` de exemplo.
- `knx connection:test` — testa as conexões configuradas.
- `knx connection:list` — lista os nomes de conexões disponíveis.

Os scripts correspondentes também existem em `package.json` (`connection:init`, `connection:test`, `connection:list`).

---

## Exemplo de migration gerada

Um arquivo de migration típico gerado pelo `MigrationGenerator` segue o padrão Knex:

```typescript
// migrations/20250311120000_create_users.ts
import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('users', (table) => {
    table.increments('id').primary();
    table.string('email', 255).notNullable().unique();
    table.string('name', 255);
    table.boolean('active').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.timestamp('deleted_at');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('users');
}
```

Esse formato é compatível com o sistema de migrations nativo do Knex e pode ser usado diretamente pelo comando `knex migrate:*` se desejado.

---

## Boas práticas para migrations

- **Revise o diff gerado**:
  - Confira o conteúdo das migrations antes de aplicar em ambientes compartilhados.
  - Evite aplicar alterações destrutivas (dropTable, dropColumn) sem plano de migração de dados.
- **Use `alterColumn` com cuidado**:
  - A mudança de tipo de coluna costuma depender do banco.
  - Muitas vezes é melhor decompor em várias migrations menores e explícitas.
- **Mantenha consistência de nomes**:
  - Use `snake_case` para nomes de tabelas e colunas.
  - Use decorators e metadata como fonte de verdade; evite divergências entre entidades e migrations manuais.
- **Automatize em CI**:
  - Em pipelines, é comum gerar migrations localmente e apenas executar `migrate:run` em produção.
  - Evite gerar migrations automaticamente em ambientes de produção.
