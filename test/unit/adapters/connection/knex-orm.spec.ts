import 'reflect-metadata';
import { join } from 'path';
import { KnexORM } from '@adapters/connection/knex-orm';
import { Entity, PrimaryKey, Column } from '@core/decorators';
import { Repository } from '@adapters/repository';

@Entity('users')
class User {
  @PrimaryKey()
  id!: number;
  @Column({ type: 'string' })
  name!: string;
}

const FIXTURES = join(__dirname, '../../../fixtures/connection');

describe('KnexORM', () => {
  afterEach(async () => {
    const orm = KnexORM.getInstance();
    if (orm) await orm.close();
  });

  it('should initialize from config and return instance', async () => {
    const orm = await KnexORM.initialize({
      default: 'primary',
      connections: {
        primary: {
          client: 'sqlite3',
          connection: { filename: ':memory:' },
        },
      },
    });

    expect(orm).toBeDefined();
    const knex = orm.getConnection('primary');
    expect(knex).toBeDefined();
  });

  it('should initialize from path', async () => {
    const orm = await KnexORM.initializeFromPath(join(FIXTURES, 'config-flat.js'));

    expect(orm).toBeDefined();
    const knex = orm.getConnection('primary');
    expect(knex).toBeDefined();
  });

  it('should getRepository for entity', async () => {
    const orm = await KnexORM.initialize({
      default: 'primary',
      connections: {
        primary: { client: 'sqlite3', connection: { filename: ':memory:' } },
      },
    });

    const repo = orm.getRepository(User);
    expect(repo).toBeInstanceOf(Repository);
    expect(repo.tableName).toBeDefined();
  });
});
