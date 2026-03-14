/**
 * Node Vanilla integration example (Module 8).
 *
 * Run: npx ts-node main.ts  (or: node --loader ts-node/esm main.ts)
 * Requires: npm i knex-orm knex reflect-metadata sqlite3
 */
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
        useNullAsDefault: true,
      },
    },
  });

  const knex = orm.getConnection();
  await knex.schema.createTableIfNotExists('users', (t) => {
    t.increments('id').primary();
    t.string('name');
    t.boolean('active');
  });

  const userRepo = orm.getRepository(User);
  await userRepo.create({ name: 'Alice', active: true });
  await userRepo.create({ name: 'Bob', active: false });

  const users = await userRepo.find({ where: { active: true } });
  console.log('Active users:', users);

  await orm.close();
}

main().catch(console.error);
