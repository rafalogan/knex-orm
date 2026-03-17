## Visão geral

O knex-orm foi desenvolvido com **TDD obrigatório**, definido em `.rules` e detalhado em `docs/DEVELOPMENT.md` e `docs/knex-orm-superset.md` (§9).  
Esta seção explica como rodar os testes, como a suite está organizada e como escrever novos testes seguindo os padrões do projeto.

---

## Como rodar os testes

Os comandos estão definidos em `package.json`:

```bash
# Jest (Node)
npm test
# ou
npm run test:node

# Coverage
npm run test:coverage

# Bun test (unitário)
npm run test:bun
```

Resumo:

- `npm test` / `npm run test:node` — roda toda a suite com Jest (Node).
- `npm run test:coverage` — Jest com relatório de cobertura (limiares em `jest.config.js`).
- `npm run test:bun` — roda testes unitários com Bun, usando `bun test` e `tsconfig.test.json`.

---

## Estrutura de testes

Conforme `.rules`, `DEVELOPMENT.md` e o código atual:

```text
test/
  unit/          # Testes unitários (decorators, metadata, runtime, adapters com mocks)
  integration/   # Testes de integração (Repository + SQLite, migrations, NestJS, Node vanilla)
  fixtures/      # Arquivos de configuração e dados auxiliares
```

Exemplos importantes:

- `test/unit/decorators/*.spec.ts` — comportamento dos decorators (`@Entity`, `@Column`, etc.).
- `test/unit/core/metadata/entity-scanner.spec.ts` — descoberta de entidades.
- `test/unit/adapters/repository/repository.spec.ts` — unidade do repositório.
- `test/integration/repository/repository-crud.spec.ts` — CRUD completo com SQLite in‑memory.
- `test/integration/repository/repository-advanced.spec.ts` — paginação, soft delete, transações.
- `test/integration/migration/*.spec.ts` — geração e execução de migrations.
- `test/integration/nestjs/nestjs-crud.spec.ts` — fluxo completo com NestJS.
- `test/integration/node-vanilla/*.spec.ts` — uso sem framework.

---

## Padrões de escrita de teste

As regras estão registradas em `.rules` e reforçadas em `docs/DEVELOPMENT.md`:

- **TDD obrigatório**:
  - Escreva o teste antes da implementação.
  - Confirme que o teste falha (RED) antes de implementar.
  - Implemente o mínimo para o teste passar (GREEN).
  - Refatore mantendo os testes verdes (REFACTOR).
- **Isolamento**:
  - Use `beforeEach`/`afterEach` para limpar o estado (bancos, mocks).
  - Evite depender da ordem de execução de testes.
- **Nomes descritivos**:
  - Em português: `"deve [resultado] quando [condição]"`.
  - Em inglês: `"should [result] when [condition]"`.
- **Cobertura alvo**:
  - Definida em `jest.config.js`:
    - `statements: 85`
    - `branches: 63`
    - `functions: 85`
    - `lines: 85`

---

## Testes de integração com SQLite

Vários testes de integração usam SQLite in‑memory, por exemplo `repository-crud.spec.ts`:

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

Padrões importantes:

- **Banco isolado** por suite (e muitas vezes esvaziado em `beforeEach`).
- **Migrações ou `schema.createTable`** realizadas no `beforeAll`.
- **`afterAll`** fecha a conexão (`db.destroy()` / `manager.closeAll()`).

---

## Testes com Bun

O script `npm run test:bun` roda:

```bash
bun test test/unit --tsconfig-override=tsconfig.test.json
```

Isso significa:

- Apenas testes **unitários** são executados com Bun (integração depende de SQLite).
- O `tsconfig.test.json` é usado para compilar os testes adequadamente em Bun.

Quando criar novos testes unitários, mantenha-os em `test/unit/**` para que sejam cobertos tanto por Jest quanto por Bun.

---

## Escrevendo novos testes

Ao adicionar novas funcionalidades:

1. **Escolha o tipo de teste**:
   - Lógica pura, sem IO → **unitário** em `test/unit/...`.
   - Fluxo completo com banco, NestJS ou CLI → **integração** em `test/integration/...`.
2. **Use fixtures quando fizer sentido**:
   - Configurações padrão podem ir em `test/fixtures/**`.
3. **Siga o padrão de nomes**:
   - Arquivos `*.spec.ts` (ou `*.test.ts`, seguindo `jest.config.js`).
4. **Mantenha independência**:
   - Sempre limpe o estado compartilhado (`beforeEach`/`afterEach`).
5. **Garanta cobertura mínima**:
   - Se a mudança for grande, rode `npm run test:coverage` e verifique se os limiares globais continuam sendo atendidos.

---

## Integração em CI

O `package.json` já define scripts adequados para CI:

- `npm test` — testes em Node.
- `npm run test:bun` — testes unitários em Bun.
- `npm run build` — build com `tsup`.

No CI típico, você deve:

1. Instalar dependências (`npm ci`).
2. Rodar testes (Node + Bun, se desejado).
3. Rodar o build.

O documento de arquitetura (`docs/knex-orm-superset.md` §12 e §13) contém exemplos de workflows GitHub Actions que podem ser adaptados.

