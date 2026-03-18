## Visão geral

Esta seção descreve como configurar conexões e ambientes para usar o knx-orm, com base em:

- `docs/knex-orm-superset.md` (seção 6)
- Tipos e implementações em `src/adapters/connection`
- Scripts de CLI definidos em `package.json`

---

## Arquivo de configuração (`orm.config.js`)

O formato de configuração é descrito pelo tipo `OrmConfig`, exportado em `src/index.ts`.  
Um exemplo típico:

```javascript
/** @type {import('knx-orm').OrmConfig} */
module.exports = {
  default: 'primary',
  connections: {
    primary: {
      client: 'postgresql',
      connection: {
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
      },
      pool: { min: 0, max: 10 },
    },
  },
};
```

Esse objeto é consumido por `KnexORM.initialize`/`KnexORM.initializeFromPath` e pelos comandos de conexão do CLI.

---

## Múltiplos ambientes

Você pode organizar a configuração por ambiente (`development`, `test`, `production`), mantendo o mesmo formato de `OrmConfig` em cada chave, conforme o superset:

```javascript
module.exports = {
  development: {
    default: 'primary',
    connections: {
      primary: {
        client: 'sqlite3',
        connection: { filename: ':memory:' },
      },
    },
  },
  test: {
    default: 'primary',
    connections: {
      primary: {
        client: 'sqlite3',
        connection: { filename: ':memory:' },
      },
    },
  },
  production: {
    default: 'primary',
    connections: {
      primary: {
        client: 'postgresql',
        connection: {
          host: process.env.DB_HOST,
          user: process.env.DB_USER,
          password: process.env.DB_PASSWORD,
          database: process.env.DB_NAME,
        },
        pool: { min: 2, max: 10 },
      },
    },
  },
};
```

O ambiente ativo é normalmente selecionado por `NODE_ENV`.

---

## Bancos suportados e drivers

O knx-orm delega totalmente ao **Knex** a comunicação com o banco.  
Drivers de banco devem ser adicionados no projeto consumidor.

Tabela resumida (conforme superset §6.3 e §13.2):

| Banco      | Driver recomendado | Node.js | Bun  |
| ---------- | ------------------ | ------- | ---- |
| PostgreSQL | `pg`               | ✅      | ✅   |
| MySQL      | `mysql2`           | ✅      | ✅   |
| SQLite     | `sqlite3`          | ✅      | ⚠️   |
| MSSQL      | `mssql`            | ✅      | ⚠️\* |
| Oracle     | `oracledb`         | ✅      | ⚠️\* |

⚠️ Em Bun, drivers baseados em native addons (`node-gyp`) tendem a não funcionar; consulte a documentação do driver/Knex antes de usar em produção.

---

## Variáveis de ambiente

Exemplo de variáveis típicas usadas no `orm.config.js`:

| Variável       | Descrição                     |
| -------------- | ----------------------------- |
| `DB_HOST`      | Host do banco                 |
| `DB_PORT`      | Porta                         |
| `DB_USER`      | Usuário                       |
| `DB_PASSWORD`  | Senha                         |
| `DB_NAME`      | Nome do banco                 |
| `DATABASE_URL` | Connection string alternativa |

O superset também sugere uma abstração `getEnv` (exposta em `src/core/runtime.ts`) para lidar com Node e Bun:

```typescript
import { getEnv } from 'knx-orm';

const host = getEnv('DB_HOST') ?? 'localhost';
```

No Bun, `process.env` e `Bun.env` são suportados; em Node, use `dotenv` ou similar para carregar `.env`.

---

## Registry de conexões

Internamente, o módulo de conexão (`src/adapters/connection`) usa:

- `ConnectionConfigLoader` — lê e valida o arquivo de config
- `ConnectionFactory` — cria instâncias Knex a partir de `ConnectionEntry`
- `ConnectionRegistry` — registra conexões por nome
- `ConnectionManager` — orquestra inicialização e encerramento de conexões

Do ponto de vista do usuário, você interage com isso via `KnexORM`:

```typescript
import { KnexORM } from 'knx-orm';

const orm = await KnexORM.initializeFromPath(); // ou initialize(config)

// Conexão default (nome em OrmConfig.default)
const defaultKnex = orm.getDefaultConnection();

// Conexão nomeada
const analyticsKnex = orm.getConnection('analytics');
```

Essas APIs usam internamente o `ConnectionManager` exportado em `src/index.ts`.

---

## Pool de conexões

Para ambientes de produção, configure o pool de forma explícita em cada `ConnectionEntry`:

```javascript
{
  client: 'postgresql',
  connection: {
    host: process.env.DB_HOST,
    // ...
  },
  pool: {
    min: 2,
    max: 10,
  },
}
```

Os valores exatos de `min` e `max` dependem da carga da aplicação e dos limites do banco.  
Consulte a documentação do Knex e do driver específico para recomendações.

---

## Boas práticas de configuração

- **Separe ambientes**: use configs distintas para desenvolvimento, teste e produção.
- **Não faça commit de segredos**: use variáveis de ambiente ou serviços de secret management.
- **Use `redactConnectionConfig` ao logar configs**: nunca logue senhas ou connection strings em claro.
- **Mantenha o `OrmConfig` simples**: delegue lógica condicional (escolha de driver por runtime, etc.) para código TypeScript quando necessário.
