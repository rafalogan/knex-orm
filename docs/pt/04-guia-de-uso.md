## Visão geral

Este guia mostra como usar as principais funcionalidades expostas pelo pacote `knx-orm`, com exemplos baseados no código real (`src/` e `test/integration/**`):

- Decorators de entidade
- `Repository<T>` e tipos relacionados
- `KnexORM` e conexões
- Integração com NestJS
- Uso do CLI para migrations

---

## Decorators de entidade

Os decorators vivem em `src/core/decorators` e são reexportados em `src/index.ts`. Os mais importantes:

- `@Entity(tableName?)`
- `@PrimaryKey(options?)`
- `@Column(options)`
- `@CreatedAt()`
- `@UpdatedAt()`
- `@SoftDelete()`
- `@Index(fields[])`

### Exemplo mínimo

```typescript
import { Entity, PrimaryKey, Column } from 'knx-orm';

@Entity('products')
export class Product {
  @PrimaryKey()
  id!: number;

  @Column({ type: 'string' })
  name!: string;

  @Column({ type: 'integer' })
  price!: number;
}
```

Esse padrão é o mesmo usado nos testes de integração de repositório (`repository-crud.spec.ts`).

### Exemplo com timestamps e soft delete

```typescript
import { Entity, PrimaryKey, Column, CreatedAt, UpdatedAt, SoftDelete } from 'knx-orm';

@Entity('articles')
export class Article {
  @PrimaryKey()
  id!: number;

  @Column({ type: 'string' })
  title!: string;

  @Column({ type: 'integer' })
  views!: number;

  @CreatedAt()
  createdAt!: Date;

  @UpdatedAt()
  updatedAt!: Date;

  @SoftDelete()
  deletedAt?: Date;
}
```

Nos testes (`repository-advanced.spec.ts`), essa entidade é usada para validar paginação, filtros, soft delete e transações.

---

## Repository<T>

O repositório genérico vive em `src/adapters/repository/repository.ts` e é exportado em `src/index.ts` como `Repository`.  
Também são exportados os tipos de apoio (`FindOptions`, `WhereClause`, `PaginateResult`, etc.).

### Criação de um repositório (Node.js)

Você normalmente não precisa instanciar o repositório manualmente, mas é útil entender o construtor, usado em testes de integração:

```typescript
import knex from 'knex';
import { Repository } from 'knx-orm';
import { Product } from './product.entity';

const db = knex({
  client: 'sqlite3',
  connection: { filename: ':memory:' },
  useNullAsDefault: true,
});

const productRepo = new Repository(db, Product);
```

Na maioria dos casos em produção, você obterá o repositório via `KnexORM` (Node vanilla) ou via NestJS (`@InjectRepository`).

### Métodos principais

Os métodos abaixo são derivados diretamente da implementação de `Repository<T>` e dos testes de integração:

- **`create(data: Partial<T>): Promise<T>`**
- **`createMany(data: Partial<T>[]): Promise<T[]>`**
- **`find(options?: FindOptions<T>): Promise<T[]>`**
- **`findOne(where: WhereClause<T>): Promise<T | null>`**
- **`findMany(options?: FindManyOptions<T>): Promise<T[]>`**
- **`findById(id: string | number): Promise<T | null>`**
- **`save(entity: Partial<T>, where?: WhereClause<T>): Promise<T>`** (insert ou update)
- **`update(where, data): Promise<T>`**
- **`updateMany({ ids }, data): Promise<number>`**
- **`delete(where): Promise<void>`**
- **`deleteMany({ ids }): Promise<number>`**
- **`disable(where): Promise<void>`** (soft delete)
- **`paginate(options?: PaginateOptions): Promise<PaginateResult<T>>`**
- **`transaction(fn): Promise<R>`**
- **`raw(sql, bindings?)`** (query bruta via Knex)

#### Exemplo: CRUD básico

```typescript
const created = await productRepo.create({ name: 'Widget', price: 99 });
const foundById = await productRepo.findById(created.id);
const updated = await productRepo.update({ id: created.id }, { price: 120 });
await productRepo.delete({ id: created.id });
```

Esse cenário é coberto por `repository-crud.spec.ts`.

#### Exemplo: filtros avançados com `$in` e `$like`

```typescript
// Filtrar por lista de valores
const inResults = await articleRepo.find({
  where: { views: { $in: [10, 30] } } as { views: { $in: number[] } },
});

// Filtrar por prefixo
const likeResults = await articleRepo.find({
  where: { title: { $like: 'Hello%' } } as { title: { $like: string } },
});
```

#### Exemplo: paginação

```typescript
const page = await articleRepo.paginate({ page: 1, limit: 10 });

console.log(page.meta.total); // total de registros
console.log(page.meta.totalPages); // quantidade de páginas
console.log(page.data); // registros da página atual
```

#### Exemplo: soft delete

```typescript
// Desabilita um registro (seta deleted_at)
await articleRepo.disable({ id: 1 });

// find() por padrão não retorna registros soft deleted
const active = await articleRepo.find({});

// withDeleted: true inclui registros deletados
const all = await articleRepo.find({ withDeleted: true });
```

#### Exemplo: transações

```typescript
await articleRepo.transaction(async (trx) => {
  const repoTrx = new Repository(trx as any, Article);
  await repoTrx.create({ title: 'InTx', views: 1 });
  await repoTrx.create({ title: 'InTx2', views: 2 });
});
```

Se a função lançar erro, a transação é revertida (veja `repository-advanced.spec.ts`).

---

## KnexORM e conexões

As APIs de alto nível para gerenciamento de conexões estão em `src/adapters/connection` e são exportadas em `src/index.ts`:

- `KnexORM`
- `ConnectionManager`
- `ConnectionFactory`
- `ConnectionRegistry`
- Tipos `OrmConfig`, `OrmConfigModule`, `ConnectionEntry`

### Inicialização programática

```typescript
import { KnexORM } from 'knx-orm';
import { User } from './entities/user';

const orm = await KnexORM.initialize({
  default: 'primary',
  connections: {
    primary: {
      client: 'sqlite3',
      connection: { filename: ':memory:' },
    },
  },
});

const userRepo = orm.getRepository(User);
const users = await userRepo.find({});

await orm.close();
```

### Inicialização via arquivo de configuração

Conforme `docs/knex-orm-superset.md`:

```typescript
import { KnexORM } from 'knx-orm';

const orm = await KnexORM.initializeFromPath(); // procura orm.config.js / knex-orm.config.js
const knex = orm.getConnection('primary'); // instância Knex
```

Consulte o arquivo de types em `@adapters/connection` para o formato exato de `OrmConfig`.

---

## Integração com NestJS

O submódulo `knx-orm/nestjs` reexporta:

- `KnexOrmModule`
- `InjectRepository`
- `InjectConnection`
- `getRepositoryToken`
- `getConnectionToken`
- `KNEX_ORM_CONNECTION_MANAGER`

### Módulo principal

```typescript
import { Module } from '@nestjs/common';
import { KnexOrmModule } from 'knx-orm/nestjs';
import { Post } from './post.entity';
import { PostService } from './post.service';

@Module({
  imports: [
    KnexOrmModule.forRoot({
      default: 'primary',
      connections: {
        primary: {
          client: 'sqlite3',
          connection: { filename: ':memory:' },
          useNullAsDefault: true,
        },
      },
    }),
    KnexOrmModule.forFeature([Post]),
  ],
  providers: [PostService],
})
export class AppModule {}
```

### Service com `@InjectRepository` e `@InjectConnection`

```typescript
import { Injectable } from '@nestjs/common';
import type { IRepository } from 'knx-orm';
import { InjectRepository, InjectConnection } from 'knx-orm/nestjs';
import type { Knex } from 'knex';
import { Post } from './post.entity';

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(Post) private readonly postRepo: IRepository<Post>,
    @InjectConnection() private readonly knex: Knex,
  ) {}

  async createPost(title: string, published: boolean): Promise<Post> {
    return this.postRepo.create({ title, published });
  }

  async findPublished(): Promise<Post[]> {
    return this.postRepo.find({ where: { published: true } });
  }
}
```

Esse exemplo segue de perto o teste `nestjs-crud.spec.ts`.

---

## CLI e migrations (resumo)

O CLI é exposto pelos binários `knx` e `knx-orm` (configurados em `package.json`). Internamente, ele usa:

- `EntityScanner` para encontrar entidades
- `SchemaRegistry` para ler/escrever `.orm-schema.json`
- `SchemaDiff` para calcular operações de diff
- `MigrationGenerator` e `MigrationWriter` para gerar migrations

### Comandos principais

- `knx migrate:generate --entities=./src/entities`
- `knx migrate:run`
- `knx migrate:rollback`
- `knx connection:init`
- `knx connection:test`
- `knx connection:list`

Detalhes completos estão no documento de **Migrações** (`08-migracoes.md`).

---

## Gotchas comuns

- **Decorators sem metadata**: sempre importe `reflect-metadata` antes de usar os decorators.
- **Soft delete**: lembre-se que `find()` esconde registros com `deleted_at` por padrão; use `withDeleted: true` se quiser encontrá-los.
- **Tipos de banco em Bun**: use PostgreSQL ou MySQL. SQLite via `sqlite3` não é suportado em Bun.
- **Configuração TypeScript**: certifique-se de que `experimentalDecorators` e `emitDecoratorMetadata` estão habilitados no projeto consumidor, não apenas na lib.
