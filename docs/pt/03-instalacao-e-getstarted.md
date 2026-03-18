## Pré-requisitos

Antes de instalar o knex-orm, verifique:

- **Node.js**: versão ≥ 18
- **Bun**: versão ≥ 1.0 (opcional)
- **Gerenciador de pacotes**: `npm`, `yarn`, `pnpm` ou `bun`
- **Banco suportado** via Knex:
  - PostgreSQL, MySQL/MySQL2, SQLite3, MSSQL, Oracle

No Bun, evite SQLite (drivers nativos não são suportados). Prefira PostgreSQL ou MySQL.

---

## Instalação

### Com npm

```bash
npm install knx-orm knex reflect-metadata
```

### Com bun

```bash
bun add knx-orm knex reflect-metadata
```

Em projetos que usam SQLite, adicione também o driver:

```bash
npm install sqlite3
```

---

## Configuração mínima (Node.js)

### 1. Habilite decorators no TypeScript

No `tsconfig.json` do seu projeto consumidor:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

### 2. Habilite `reflect-metadata`

No ponto de entrada da aplicação (por exemplo `src/main.ts` ou `index.ts`):

```typescript
import 'reflect-metadata';
```

---

## Hello World — Node.js (vanilla)

Este exemplo é baseado no fluxo descrito em `docs/knex-orm-superset.md` (§8) e nos testes de repositório.

### 1. Defina uma entidade

```typescript
// src/entities/user.ts
import { Entity, PrimaryKey, Column, CreatedAt, UpdatedAt, SoftDelete } from 'knx-orm';

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

### 2. Inicialize o KnexORM e use o repositório

```typescript
// src/main.ts
import 'reflect-metadata';
import { KnexORM } from 'knx-orm';
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

Esse exemplo é análogo ao mostrado em `examples/node-vanilla` e nos testes de integração de repositório com SQLite in‑memory.

---

## Hello World — NestJS

Baseado em `test/integration/nestjs/nestjs-crud.spec.ts` e `examples/nestjs/README.md`.

### 1. Entidade

```typescript
// src/users/user.entity.ts
import { Entity, PrimaryKey, Column } from 'knx-orm';

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

### 2. Módulo principal

```typescript
// src/app.module.ts
import { Module } from '@nestjs/common';
import { KnexOrmModule } from 'knx-orm/nestjs';
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

### 3. Service usando `@InjectRepository`

```typescript
// src/users/user.service.ts
import { Injectable } from '@nestjs/common';
import type { IRepository } from 'knx-orm';
import { InjectRepository } from 'knx-orm/nestjs';
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

Esse padrão é o mesmo usado no teste de integração NestJS: o módulo registra as entidades com `forFeature`, e os serviços recebem o repositório tipado via injeção de dependência.

---

## Verificando a instalação

Depois de instalar e compilar o projeto que consome o knex-orm:

- Rode os testes do seu projeto para garantir que a configuração de decorators está correta.
- Opcionalmente, execute um comando simples do CLI (no projeto consumidor) para validar o ambiente e a introspecção do projeto:

```bash
npx knx --help
```

Se o binário for encontrado e os comandos de ajuda forem exibidos, o pacote está instalado corretamente.  
Para testar a detecção automática de estrutura, rode:

```bash
npx knx migrate:generate
```

Em um projeto com entidades e migrations nos diretórios convencionais (ou configurados em `knexfile` / `knex.config`), o comando deve funcionar **sem parâmetros**, gerando migrations a partir das entidades.
