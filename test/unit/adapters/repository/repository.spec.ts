import 'reflect-metadata';
import type { Knex } from 'knex';
import { Entity, PrimaryKey, Column, getEntityMetadata } from '@core/decorators';
import { Repository } from '@adapters/repository';

@Entity('users')
class User {
  @PrimaryKey()
  id!: number;

  @Column({ type: 'string' })
  email!: string;

  @Column({ type: 'string' })
  name!: string;
}

function createThenableChain<T>(defaultValue: T) {
  let resolveValue: T = defaultValue;
  const chain = {
    _setResolve: (v: T) => {
      resolveValue = v;
    },
    insert: jest.fn().mockImplementation(() => chain),
    returning: jest.fn().mockImplementation((_cols?: string) => Promise.resolve(resolveValue)),
    select: jest.fn().mockImplementation(() => chain),
    where: jest.fn().mockImplementation(() => chain),
    whereIn: jest.fn().mockImplementation(() => chain),
    update: jest.fn().mockImplementation(() => chain),
    del: jest.fn().mockResolvedValue(0),
    limit: jest.fn().mockImplementation(() => chain),
    offset: jest.fn().mockImplementation(() => chain),
    orderBy: jest.fn().mockImplementation(() => Promise.resolve(resolveValue)),
    first: jest.fn().mockResolvedValue(null),
    count: jest.fn().mockImplementation(() => chain),
  };
  chain.then = (fn?: (v: T) => unknown) =>
    Promise.resolve(typeof fn === 'function' ? fn(resolveValue) : resolveValue);
  chain.catch = () => chain;
  return chain as typeof chain & PromiseLike<T>;
}

function createMockKnex(): Knex {
  const chain = createThenableChain<unknown[]>([]);

  const knexFn = jest.fn((_tableName: string) => chain);
  (knexFn as Knex).raw = jest.fn().mockResolvedValue([]);
  (knexFn as Knex).transaction = jest.fn().mockImplementation(async (fn: (trx: Knex.Transaction) => unknown) =>
    fn(knexFn as unknown as Knex.Transaction),
  );

  return knexFn as unknown as Knex;
}

describe('Repository', () => {
  let mockKnex: Knex;
  let repo: Repository<User>;

  beforeEach(() => {
    mockKnex = createMockKnex();
    repo = new Repository(mockKnex, User);
  });

  describe('query', () => {
    it('should return query builder for table when query() is called', () => {
      const qb = repo.query();

      expect(mockKnex).toHaveBeenCalledWith('users');
      expect(qb).toBeDefined();
    });

    it('should allow chaining where via query builder', () => {
      repo.query().where('email', 'test@example.com');

      expect(mockKnex).toHaveBeenCalledWith('users');
    });
  });

  describe('knex', () => {
    it('should return knex instance when knex() is called', () => {
      const knex = repo.knex();

      expect(knex).toBe(mockKnex);
    });
  });

  describe('raw', () => {
    it('should execute raw query when raw() is called', async () => {
      await repo.raw('SELECT * FROM users WHERE id = ?', [1]);

      expect((mockKnex as Knex & { raw: jest.Mock }).raw).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE id = ?',
        [1],
      );
    });
  });

  describe('transaction', () => {
    it('should run callback inside transaction', async () => {
      const txMock = (mockKnex as Knex & { transaction: jest.Mock }).transaction;
      const callback = jest.fn().mockResolvedValue(42);

      const result = await repo.transaction(callback);

      expect(txMock).toHaveBeenCalled();
      expect(callback).toHaveBeenCalledWith(expect.anything());
      expect(result).toBe(42);
    });
  });

  describe('create', () => {
    it('should insert entity and return with id when create() is called', async () => {
      const chain = (mockKnex as jest.Mock)();
      chain._setResolve([{ id: 1, email: 'a@b.com', name: 'Alice' }]);

      const result = await repo.create({ email: 'a@b.com', name: 'Alice' });

      expect(mockKnex).toHaveBeenCalledWith('users');
      expect(chain.insert).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'a@b.com', name: 'Alice' }),
      );
      expect(chain.returning).toHaveBeenCalledWith('*');
      expect(result).toMatchObject({ id: 1, email: 'a@b.com', name: 'Alice' });
    });
  });

  describe('createMany', () => {
    it('should insert multiple entities when createMany() is called', async () => {
      const chain = (mockKnex as jest.Mock)();
      chain._setResolve([
        { id: 1, email: 'a@b.com', name: 'Alice' },
        { id: 2, email: 'b@b.com', name: 'Bob' },
      ]);

      const result = await repo.createMany([
        { email: 'a@b.com', name: 'Alice' },
        { email: 'b@b.com', name: 'Bob' },
      ]);

      expect(chain.insert).toHaveBeenCalledWith([
        expect.objectContaining({ email: 'a@b.com', name: 'Alice' }),
        expect.objectContaining({ email: 'b@b.com', name: 'Bob' }),
      ]);
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({ id: 1, email: 'a@b.com' });
    });
  });

  describe('findById', () => {
    it('should return entity when found by id', async () => {
      const meta = getEntityMetadata(User);
      const pkColumn = meta?.primaryKey?.columnName ?? 'id';
      const chain = (mockKnex as jest.Mock)();
      chain.first.mockResolvedValueOnce({ id: 1, email: 'a@b.com', name: 'Alice' });

      const result = await repo.findById(1);

      expect(chain.where).toHaveBeenCalledWith(pkColumn, 1);
      expect(result).toMatchObject({ id: 1, email: 'a@b.com', name: 'Alice' });
    });

    it('should return null when not found', async () => {
      const chain = (mockKnex as jest.Mock)();
      chain.first.mockResolvedValueOnce(undefined);

      const result = await repo.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('findMany', () => {
    it('should return array of entities when findMany() is called', async () => {
      const chain = (mockKnex as jest.Mock)();
      chain._setResolve([{ id: 1, email: 'a@b.com', name: 'Alice' }]);

      const result = await repo.findMany({ limit: 10 });

      expect(chain.select).toHaveBeenCalledWith('*');
      expect(chain.limit).toHaveBeenCalledWith(10);
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ id: 1, email: 'a@b.com', name: 'Alice' });
    });
  });

  describe('update', () => {
    it('should update entity and return when update() is called', async () => {
      const meta = getEntityMetadata(User);
      const pkColumn = meta?.primaryKey?.columnName ?? 'id';
      const chain = (mockKnex as jest.Mock)();
      chain.update.mockImplementation(() => chain);
      chain._setResolve([{ id: 1, email: 'new@b.com', name: 'Alice' }]);

      const result = await repo.update({ [pkColumn]: 1 }, { email: 'new@b.com' });

      expect(chain.update).toHaveBeenCalledWith(expect.objectContaining({ email: 'new@b.com' }));
      expect(chain.returning).toHaveBeenCalledWith('*');
      expect(result).toMatchObject({ id: 1, email: 'new@b.com' });
    });
  });

  describe('updateMany', () => {
    it('should update multiple entities when updateMany() is called', async () => {
      const chain = (mockKnex as jest.Mock)();
      chain.whereIn.mockImplementation(() => chain);
      chain.update.mockResolvedValueOnce(2);

      const result = await repo.updateMany({ ids: [1, 2] }, { name: 'Updated' });

      expect(chain.whereIn).toHaveBeenCalledWith('id', [1, 2]);
      expect(chain.update).toHaveBeenCalledWith(expect.objectContaining({ name: 'Updated' }));
      expect(result).toBe(2);
    });
  });

  describe('delete', () => {
    it('should delete entity when delete() is called', async () => {
      const meta = getEntityMetadata(User);
      const pkColumn = meta?.primaryKey?.columnName ?? 'id';
      const chain = (mockKnex as jest.Mock)();
      chain.del.mockResolvedValueOnce(1);

      await repo.delete({ [pkColumn]: 1 });

      expect(chain.where).toHaveBeenCalledWith(expect.objectContaining({ [pkColumn]: 1 }));
      expect(chain.del).toHaveBeenCalled();
    });
  });

  describe('deleteMany', () => {
    it('should delete multiple entities when deleteMany() is called', async () => {
      const chain = (mockKnex as jest.Mock)();
      chain.whereIn.mockImplementation(() => chain);
      chain.del.mockResolvedValueOnce(3);

      const result = await repo.deleteMany({ ids: [1, 2, 3] });

      expect(chain.whereIn).toHaveBeenCalledWith('id', [1, 2, 3]);
      expect(chain.del).toHaveBeenCalled();
      expect(result).toBe(3);
    });
  });

  describe('paginate', () => {
    it('should return paginated result when paginate() is called', async () => {
      const chain = (mockKnex as jest.Mock)();
      chain._setResolve([{ id: 1, email: 'a@b.com', name: 'Alice' }, { id: 2, email: 'b@b.com', name: 'Bob' }]);
      chain.count.mockImplementation(() => ({ first: () => Promise.resolve({ count: 25 }) }));

      const result = await repo.paginate({ page: 2, limit: 10 });

      expect(chain.limit).toHaveBeenCalledWith(10);
      expect(chain.offset).toHaveBeenCalledWith(10);
      expect(result).toMatchObject({
        data: expect.any(Array),
        meta: expect.objectContaining({ page: 2, limit: 10, total: 25, totalPages: 3 }),
      });
      expect(result.data).toHaveLength(2);
    });
  });
});
