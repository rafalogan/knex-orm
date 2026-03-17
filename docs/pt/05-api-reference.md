## Visão geral

Esta referência descreve os **exports públicos** do pacote `knx-orm`, com base em `src/index.ts` e nos tipos/implementações reais.  
Para detalhes de arquitetura e decisões, consulte também `docs/knex-orm-superset.md`.

---

## Decorators

Exportados por `src/index.ts`:

- `Entity`
- `Column`
- `PrimaryKey`
- `CreatedAt`
- `UpdatedAt`
- `getEntityMetadata`

Assinaturas simplificadas (tipos exatos podem ser verificados nos arquivos em `src/core/decorators` e `src/core/types`):

```typescript
function Entity(tableName?: string): ClassDecorator;

interface ColumnOptions {
  type: string;
  nullable?: boolean;
  default?: unknown;
  unique?: boolean;
  index?: boolean;
  // outros campos específicos mapeados para o schema do Knex
}

function Column(options: ColumnOptions): PropertyDecorator;
function PrimaryKey(): PropertyDecorator;
function CreatedAt(): PropertyDecorator;
function UpdatedAt(): PropertyDecorator;

function getEntityMetadata(target: Function): EntityMetadata | undefined;
```

`EntityMetadata` e `ColumnMetadata` são descritos na próxima seção.

---

## Tipos de metadata

Exportados por `src/index.ts`:

- `EntityMetadata`
- `ColumnMetadata`
- `ColumnOptions`

Esses tipos vivem em `src/core/types/entity-metadata.ts` e `src/core/types/column-metadata.ts`.  
De forma resumida:

```typescript
interface ColumnMetadata {
  propertyName: string;
  columnName: string;
  type: string;
  nullable?: boolean;
  defaultValue?: unknown;
  unique?: boolean;
  indexed?: boolean;
}

interface EntityMetadata {
  target: Function;
  tableName: string;
  columns: Record<string, ColumnMetadata>;
  primaryKey?: {
    propertyName: string;
    columnName: string;
  };
  softDelete?: {
    propertyName: string;
    columnName: string;
  };
}
```

Esses tipos são consumidos pelo `Repository<T>`, pelos builders de schema e pelo diff de migrations.

---

## Repositório

Exportado em `src/index.ts`:

- `Repository`
- `IRepository<T>` (como alias)
- `PaginateOptions`
- `PaginateResult`
- `FindManyOptions`
- `FindOptions`
- `WhereClause`
- `IdsFilter`

### Interface conceitual de `IRepository<T>`

Os métodos estão alinhados com `src/adapters/repository/repository.ts` e com o documento de arquitetura:

```typescript
interface WhereClause<T> {
  [K in keyof T]?: T[K] | { $eq?: T[K]; $ne?: T[K]; $in?: T[K][]; $like?: string };
}

interface FindOptions<T> {
  select?: (keyof T)[];
  where?: WhereClause<T>;
  orderBy?: { [K in keyof T]?: 'asc' | 'desc' };
  limit?: number;
  offset?: number;
  withDeleted?: boolean;
}

interface PaginateOptions {
  page?: number;
  limit?: number;
  orderBy?: string;
  order?: 'asc' | 'desc';
}

interface PaginateResult<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface IRepository<T> {
  create(data: Partial<T>): Promise<T>;
  createMany(data: Partial<T>[]): Promise<T[]>;
  save(entity: Partial<T>, where?: WhereClause<T>): Promise<T>;
  find(options?: FindOptions<T>): Promise<T[]>;
  findOne(where: WhereClause<T>): Promise<T | null>;
  findMany(options?: FindManyOptions<T>): Promise<T[]>;
  findById(id: string | number): Promise<T | null>;
  update(where: Partial<T> | { [key: string]: string | number }, data: Partial<T>): Promise<T>;
  updateMany(where: { ids: (string | number)[] }, data: Partial<T>): Promise<number>;
  delete(where: Partial<T> | { [key: string]: string | number }): Promise<void>;
  deleteMany(where: { ids: (string | number)[] }): Promise<number>;
  disable(where: WhereClause<T>): Promise<void>;
  paginate(options?: PaginateOptions): Promise<PaginateResult<T>>;
}
```

Na implementação atual, `IRepository<T>` é um alias de `Repository<T>` (veja `src/index.ts`).

### Exemplo de uso

```typescript
import { Repository } from 'knx-orm';
import type { Knex } from 'knex';
import { Product } from './product.entity';

declare const knex: Knex;

const repo = new Repository<Product>(knex, Product);

const list = await repo.find({ where: { price: { $in: [10, 20] } } as any });
```

---

## Engine de migrations

Exportados em `src/index.ts`:

- `MigrationEngine`
- `SchemaBuilder`
- `SchemaDiff`
- `SchemaRegistry`
- `MigrationGenerator`
- `MigrationWriter`
- `EntityScanner`
- Tipos `GenerateOptions`, `GenerateResult`, `MigrationOp`, `OrmSchema`

Essas APIs são usadas principalmente pelo CLI e por ferramentas de automação; a maioria dos usuários finais interage apenas via comando `kor`.

### Exemplo conceitual de geração de migrations

```typescript
import { EntityScanner, MigrationEngine } from 'knx-orm';

const entities = EntityScanner.scanFromPaths(['./dist/entities']);

const engine = new MigrationEngine({
  entities,
  schemaRegistry: new SchemaRegistry(/* ... */),
  migrationGenerator: new MigrationGenerator(/* ... */),
  migrationWriter: new MigrationWriter(/* ... */),
});

const result = await engine.generate({
  entitiesPath: './dist/entities',
  migrationsDir: './migrations',
});

console.log(result.files); // arquivos de migration gerados
```

Para o fluxo completo, consulte `docs/pt/08-migracoes.md`.

---

## KnexAdapter

Exportado em `src/index.ts`:

- `KnexAdapter`

O `KnexAdapter` implementa a interface de conexão da camada de core sobre o cliente Knex. Em geral, você não precisa instanciá‑lo diretamente — ele é usado internamente por `ConnectionFactory`/`ConnectionManager` — mas é importante saber que:

- Ele encapsula uma instância Knex.
- Expõe métodos para obter o query builder e controlar o ciclo de vida da conexão.

---

## Runtime (Node/Bun)

Exportados em `src/index.ts` a partir de `src/core/runtime.ts`:

- `isBun()`
- `isNode()`
- `getRuntime()`
- `getEnv()`
- Tipo `Runtime`

Assinaturas:

```typescript
type Runtime = 'node' | 'bun';

function isBun(): boolean;
function isNode(): boolean;
function getRuntime(): Runtime;
function getEnv(key: string): string | undefined;
```

### Exemplo

```typescript
import { getRuntime, getEnv } from 'knx-orm';

const runtime = getRuntime(); // 'node' ou 'bun'
const dbHost = getEnv('DB_HOST') ?? 'localhost';
```

---

## Segurança

Exportados em `src/index.ts`:

- `redactConnectionConfig`
- `isValidSqlIdentifier`

Essas funções vivem em `src/core/security` e são usadas para:

- Garantir que nomes de tabela/coluna sejam identificadores válidos antes de gerar SQL.
- Remover dados sensíveis (como senha/connection string) ao logar configs.

Assinaturas simplificadas:

```typescript
function isValidSqlIdentifier(name: string): boolean;

function redactConnectionConfig<T extends object>(config: T): T;
```

---

## Conexões e KnexORM

Exportados em `src/index.ts` a partir de `src/adapters/connection`:

- `KnexORM`
- `ConnectionManager`
- `ConnectionConfigLoader`
- `ConnectionFactory`
- `ConnectionRegistry`
- Tipos `OrmConfig`, `OrmConfigModule`, `ConnectionEntry`

### Tipos principais

Os tipos completos estão em `src/adapters/connection/connection-config.ts`, mas conceitualmente:

```typescript
interface ConnectionEntry {
  client: string;
  connection: unknown; // objeto de configuração aceito pelo Knex
  pool?: { min?: number; max?: number };
}

interface OrmConfig {
  default: string;
  connections: Record<string, ConnectionEntry>;
}
```

### API de `KnexORM`

As assinaturas exatas podem evoluir, mas o uso típico (baseado no superset e nos exemplos) é:

```typescript
class KnexORM {
  static initialize(config: OrmConfig): Promise<KnexORM>;
  static initializeFromPath(path?: string): Promise<KnexORM>;

  getRepository<T>(entity: new () => T): Repository<T>;
  getConnection(name?: string): import('knex').Knex;
  getDefaultConnection(): import('knex').Knex;
  close(): Promise<void>;
}
```

### Exemplo

```typescript
import { KnexORM } from 'knx-orm';
import { User } from './entities/user';

const orm = await KnexORM.initialize({
  default: 'primary',
  connections: {
    primary: {
      client: 'postgresql',
      connection: { host: 'localhost', database: 'app' },
    },
  },
});

const repo = orm.getRepository(User);
const users = await repo.find({});

await orm.close();
```

---

## Módulo NestJS

O subpath `knx-orm/nestjs` exporta:

- `KnexOrmModule`
- `InjectRepository`
- `InjectConnection`
- `getRepositoryToken`
- `getConnectionToken`
- `KNEX_ORM_CONNECTION_MANAGER`

Essas APIs são descritas em detalhes em `docs/pt/04-guia-de-uso.md` (seção NestJS); consulte lá para exemplos completos.

