/**
 * Integration test: Repository CRUD cycle with SQLite in-memory.
 * Module 9 — GenericRepository integration.
 */
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

  afterAll(async () => {
    await db.destroy();
  });

  beforeEach(async () => {
    await db('products').del();
  });

  it('should create and findById', async () => {
    const created = await repo.create({ name: 'Widget', price: 99 });
    expect(created.id).toBeDefined();
    expect(created.name).toBe('Widget');
    expect(created.price).toBe(99);

    const found = await repo.findById(created.id);
    expect(found).toMatchObject({ name: 'Widget', price: 99 });
  });

  it('should find with where clause', async () => {
    await repo.create({ name: 'A', price: 10 });
    await repo.create({ name: 'B', price: 20 });

    const results = await repo.find({ where: { price: 20 } });
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('B');
  });

  it('should update and delete', async () => {
    const created = await repo.create({ name: 'Old', price: 1 });

    await repo.update({ id: created.id }, { name: 'New' });
    const updated = await repo.findById(created.id);
    expect(updated?.name).toBe('New');

    await repo.delete({ id: created.id });
    const gone = await repo.findById(created.id);
    expect(gone).toBeNull();
  });
});
