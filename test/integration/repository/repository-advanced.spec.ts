/**
 * Integration test: Repository advanced features.
 * Pagination, soft delete, $in/$like operators, createMany, transaction.
 */
import 'reflect-metadata';
import knex, { type Knex } from 'knex';
import { Entity, PrimaryKey, Column, CreatedAt, UpdatedAt, SoftDelete } from '@core/decorators';
import { Repository } from '@adapters/repository';

@Entity('articles')
class Article {
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

describe('Repository advanced integration', () => {
  let db: Knex;
  let repo: Repository<Article>;

  beforeAll(async () => {
    db = knex({
      client: 'sqlite3',
      connection: { filename: ':memory:' },
      useNullAsDefault: true,
    });
    await db.schema.createTable('articles', (t) => {
      t.increments('id').primary();
      t.string('title');
      t.integer('views');
      t.timestamp('created_at').defaultTo(db.fn.now());
      t.timestamp('updated_at').defaultTo(db.fn.now());
      t.timestamp('deleted_at');
    });
    repo = new Repository(db, Article);
  });

  afterAll(async () => {
    await db.destroy();
  });

  beforeEach(async () => {
    await db('articles').del();
  });

  it('should paginate results correctly', async () => {
    await repo.createMany([
      { title: 'A', views: 1 },
      { title: 'B', views: 2 },
      { title: 'C', views: 3 },
    ]);

    const page1 = await repo.paginate({ page: 1, limit: 2 });
    expect(page1.data).toHaveLength(2);
    expect(page1.meta.total).toBe(3);
    expect(page1.meta.totalPages).toBe(2);
    expect(page1.meta.page).toBe(1);
    expect(page1.meta.limit).toBe(2);

    const page2 = await repo.paginate({ page: 2, limit: 2 });
    expect(page2.data).toHaveLength(1);
  });

  it('should filter with $in operator', async () => {
    await repo.create({ title: 'X', views: 10 });
    await repo.create({ title: 'Y', views: 20 });
    await repo.create({ title: 'Z', views: 30 });

    const results = await repo.find({
      where: { views: { $in: [10, 30] } } as { views: { $in: number[] } },
    });
    expect(results).toHaveLength(2);
    const views = results.map((r) => r.views).sort((a, b) => (a ?? 0) - (b ?? 0));
    expect(views).toEqual([10, 30]);
  });

  it('should filter with $like operator', async () => {
    await repo.create({ title: 'Hello World', views: 1 });
    await repo.create({ title: 'Hello Universe', views: 2 });
    await repo.create({ title: 'Goodbye', views: 3 });

    const results = await repo.find({
      where: { title: { $like: 'Hello%' } } as { title: { $like: string } },
    });
    expect(results).toHaveLength(2);
    expect(results.every((r) => r.title.startsWith('Hello'))).toBe(true);
  });

  it('should support orderBy, limit and offset in find', async () => {
    await repo.createMany([
      { title: 'First', views: 10 },
      { title: 'Second', views: 20 },
      { title: 'Third', views: 30 },
    ]);

    const results = await repo.find({
      orderBy: { views: 'desc' },
      limit: 2,
      offset: 1,
    });
    expect(results).toHaveLength(2);
    expect(results[0].views).toBeGreaterThanOrEqual(results[1].views ?? 0);
  });

  it('should soft delete and exclude by default', async () => {
    const a = await repo.create({ title: 'ToDelete', views: 1 });

    await repo.disable({ id: a.id });

    const withoutDeleted = await repo.find({});
    expect(withoutDeleted).toHaveLength(0);

    const withDeleted = await repo.find({ withDeleted: true });
    expect(withDeleted).toHaveLength(1);
    expect(withDeleted[0].deletedAt).toBeDefined();
  });

  it('should run operations inside transaction', async () => {
    await repo.transaction(async (trx) => {
      const repoTrx = new Repository(trx as Knex, Article);
      await repoTrx.create({ title: 'InTx', views: 1 });
      await repoTrx.create({ title: 'InTx2', views: 2 });
    });

    const all = await repo.find({});
    expect(all).toHaveLength(2);
  });

  it('should rollback transaction on error', async () => {
    await expect(
      repo.transaction(async (trx) => {
        const repoTrx = new Repository(trx as Knex, Article);
        await repoTrx.create({ title: 'BeforeError', views: 1 });
        throw new Error('Rollback');
      }),
    ).rejects.toThrow('Rollback');

    const all = await repo.find({});
    expect(all).toHaveLength(0);
  });

  it('should updateMany by ids', async () => {
    const items = await repo.createMany([
      { title: 'A', views: 1 },
      { title: 'B', views: 2 },
      { title: 'C', views: 3 },
    ]);

    const ids = items.map((a) => a.id).filter((id): id is number => id != null);
    const count = await repo.updateMany({ ids }, { views: 99 });

    expect(count).toBe(3);

    const updated = await repo.find({ where: { views: 99 } });
    expect(updated).toHaveLength(3);
  });

  it('should deleteMany by ids', async () => {
    const items = await repo.createMany([
      { title: 'A', views: 1 },
      { title: 'B', views: 2 },
    ]);

    const ids = items.map((a) => a.id).filter((id): id is number => id != null);
    const count = await repo.deleteMany({ ids });

    expect(count).toBe(2);

    const remaining = await repo.find({});
    expect(remaining).toHaveLength(0);
  });
});
