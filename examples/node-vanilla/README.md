# Exemplo Node Vanilla — KnexORM

Exemplo mínimo de uso do KnexORM em Node.js sem framework (Module 8).

## Instalação

```bash
npm i knx-orm knex reflect-metadata sqlite3
```

## Uso

```typescript
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
  const users = await userRepo.find({ where: { active: true } });

  await orm.close();
}
```

## Executar o exemplo

Após build do pacote (`npm run build` na raiz) e com `knx-orm` instalado ou linkado:

```bash
npx ts-node main.ts
```

Ou com Bun:

```bash
bun run main.ts
```

## Alternativas

- **initializeFromPath**: carrega config de `orm.config.js` ou `knexfile.js`
- **getConnection(name)**: conexão nomeada para multi-DB
- **KnexORM.getInstance()**: instância global após `initialize()`
