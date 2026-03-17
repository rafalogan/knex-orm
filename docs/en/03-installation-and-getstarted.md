## Prerequisites

Before installing knex-orm, make sure you have:

- **Node.js**: version ≥ 18
- **Bun**: version ≥ 1.0 (optional)
- **Package manager**: `npm`, `yarn`, `pnpm` or `bun`
- **Supported database** via Knex:
  - PostgreSQL, MySQL/MySQL2, SQLite3, MSSQL, Oracle

On Bun, avoid SQLite (native‑addon drivers are not supported). Prefer PostgreSQL or MySQL.

---

## Installation

### With npm

```bash
npm install knex-orm knex reflect-metadata
```

### With bun

```bash
bun add knex-orm knex reflect-metadata
```

For projects using SQLite, also install the driver:

```bash
npm install sqlite3
```

---

## Minimal configuration (Node.js)

### 1. Enable decorators in TypeScript

In the consumer project’s `tsconfig.json`:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

### 2. Enable `reflect-metadata`

In your application entry point (for example `src/main.ts` or `index.ts`):

```typescript
import 'reflect-metadata';
```

---

## Hello World — Node.js (vanilla)

This example is based on the flow described in `docs/knex-orm-superset.md` (§8) and the repository tests.

### 1. Define an entity

```typescript
// src/entities/user.ts
import { Entity, PrimaryKey, Column, CreatedAt, UpdatedAt, SoftDelete } from 'knex-orm';

@Entity('users')
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

### 2. Initialize KnexORM and use the repository

```typescript
// src/main.ts
import 'reflect-metadata';
import { KnexORM } from 'knex-orm';
import { User } from './entities/user';

async function main() {
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

  const created = await userRepo.create({ email: 'alice@example.com', name: 'Alice' });
  console.log('Created user:', created);

  const found = await userRepo.find({ where: { email: 'alice@example.com' } });
  console.log('Found users:', found);

  await orm.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

This is analogous to the example in `examples/node-vanilla` and the repository integration tests with SQLite in‑memory.

---

## Hello World — NestJS

Based on `test/integration/nestjs/nestjs-crud.spec.ts` and `examples/nestjs/README.md`.

### 1. Entity

```typescript
// src/users/user.entity.ts
import { Entity, PrimaryKey, Column } from 'knex-orm';

@Entity('users')
export class User {
  @PrimaryKey()
  id!: number;

  @Column({ type: 'string' })
  name!: string;

  @Column({ type: 'boolean' })
  active!: boolean;
}
```

### 2. Root module

```typescript
// src/app.module.ts
import { Module } from '@nestjs/common';
import { KnexOrmModule } from 'knex-orm/nestjs';
import { User } from './users/user.entity';
import { UserService } from './users/user.service';

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
    KnexOrmModule.forFeature([User]),
  ],
  providers: [UserService],
})
export class AppModule {}
```

### 3. Service using `@InjectRepository`

```typescript
// src/users/user.service.ts
import { Injectable } from '@nestjs/common';
import type { IRepository } from 'knex-orm';
import { InjectRepository } from 'knex-orm/nestjs';
import { User } from './user.entity';

@Injectable()
export class UserService {
  constructor(@InjectRepository(User) private readonly userRepo: IRepository<User>) {}

  async create(name: string): Promise<User> {
    return this.userRepo.create({ name, active: true });
  }

  async findActive(): Promise<User[]> {
    return this.userRepo.find({ where: { active: true } });
  }
}
```

This pattern is the same used in the NestJS integration test: the module registers entities with `forFeature`, and services receive the typed repository via dependency injection.

---

## Verifying your setup

After installing and building the consumer project:

- Run your project’s tests to ensure decorator configuration is correct.
- Optionally, run a simple CLI command in the consumer project to validate the environment:

```bash
npx kor --help
```

If the binary is found and the help output is displayed, the package is installed correctly.

