import type { Knex } from 'knex';
import type { EntityMetadata } from '@core/types/entity-metadata';
import { getEntityMetadata } from '@core/decorators';
import type {
  PaginateOptions,
  PaginateResult,
  FindManyOptions,
  FindOptions,
  WhereClause,
} from './types';

/**
 * Repository genérico com CRUD, query builder e raw queries.
 * Tipado pela classe de entidade. Usa metadata do decorator @Entity.
 */
export class Repository<T extends Record<string, unknown>> {
  private readonly knexInstance: Knex;
  private readonly entityClass: new () => T;
  private readonly metadata: EntityMetadata;

  constructor(knex: Knex, entityClass: new () => T, metadata?: EntityMetadata) {
    this.knexInstance = knex;
    this.entityClass = entityClass;
    this.metadata = metadata ?? (getEntityMetadata(entityClass) as EntityMetadata);
    if (!this.metadata?.tableName) {
      throw new TypeError(
        `Entity ${entityClass.name} must be decorated with @Entity`,
      );
    }
  }

  /** Table name from entity metadata. */
  get tableName(): string {
    return this.metadata.tableName;
  }

  /** Primary key column name. */
  private get primaryKeyColumn(): string {
    return this.metadata.primaryKey?.columnName ?? 'id';
  }

  /** Returns query builder for this table. */
  query(): Knex.QueryBuilder {
    return this.knexInstance(this.tableName);
  }

  /** Returns raw Knex instance. */
  knex(): Knex {
    return this.knexInstance;
  }

  /**
   * Executes raw SQL. Use parameterized queries (bindings) to prevent SQL injection.
   * Never concatenate user input into the sql string.
   * @param sql - SQL string with ? placeholders for bindings
   * @param bindings - Values to bind (escaped by Knex)
   */
  raw<TR = unknown>(
    sql: string,
    bindings?: Knex.RawBinding | readonly Knex.RawBinding[] | Knex.ValueDict,
  ): Knex.Raw<TR> {
    return bindings !== undefined
      ? (this.knexInstance.raw as (s: string, b: unknown) => Knex.Raw<TR>)(
          sql,
          bindings,
        )
      : (this.knexInstance.raw as (s: string) => Knex.Raw<TR>)(sql);
  }

  /** Runs operations inside a transaction. */
  async transaction<R>(
    fn: (trx: Knex.Transaction) => Promise<R>,
  ): Promise<R> {
    return this.knexInstance.transaction(fn);
  }

  /** Maps DB row (snake_case) to entity (camelCase). */
  private mapRowToEntity(row: Record<string, unknown>): T {
    const instance = new this.entityClass();
    const columns = this.metadata.columns ?? {};
    for (const [prop, colMeta] of Object.entries(columns)) {
      if (colMeta.columnName in row) {
        (instance as Record<string, unknown>)[prop] = row[colMeta.columnName];
      }
    }
    const pk = this.metadata.primaryKey;
    if (pk && pk.columnName in row) {
      (instance as Record<string, unknown>)[pk.propertyName] = row[pk.columnName];
    }
    return instance;
  }

  /** Resolves property name to column name. */
  private propToColumn(prop: string): string {
    const pk = this.metadata.primaryKey;
    if (pk && pk.propertyName === prop) return pk.columnName;
    const col = this.metadata.columns?.[prop];
    return col?.columnName ?? prop;
  }

  /** Applies WhereClause (including $eq, $ne, $in, $like) to query builder. */
  private applyWhereClause(
    qb: Knex.QueryBuilder,
    where: WhereClause<T>,
  ): Knex.QueryBuilder {
    const entries = Object.entries(where) as [keyof T & string, unknown][];
    for (const [prop, val] of entries) {
      if (val === undefined) continue;
      const col = this.propToColumn(prop);
      if (val !== null && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
        const op = val as { $eq?: unknown; $ne?: unknown; $in?: unknown[]; $like?: string };
        if ('$eq' in op && op.$eq !== undefined) qb = qb.where(col, op.$eq);
        else if ('$ne' in op && op.$ne !== undefined)
          qb = qb.whereNot(col, op.$ne);
        else if ('$in' in op && Array.isArray(op.$in))
          qb = qb.whereIn(col, op.$in as readonly (string | number)[]);
        else if ('$like' in op && typeof op.$like === 'string')
          qb = qb.where(col, 'like', op.$like);
      } else {
        qb = qb.where(col, val);
      }
    }
    return qb;
  }

  /** Converts entity to DB row (camelCase to snake_case). */
  private toRow(data: Partial<T>): Record<string, unknown> {
    const row: Record<string, unknown> = {};
    const dataRecord = data as Record<string, unknown>;
    const columns = this.metadata.columns ?? {};
    for (const [prop, colMeta] of Object.entries(columns)) {
      if (prop in dataRecord && dataRecord[prop] !== undefined) {
        row[colMeta.columnName] = dataRecord[prop];
      }
    }
    const pk = this.metadata.primaryKey;
    if (pk && pk.propertyName in dataRecord && dataRecord[pk.propertyName] !== undefined) {
      row[pk.columnName] = dataRecord[pk.propertyName];
    }
    return row;
  }

  async create(data: Partial<T>): Promise<T> {
    const row = this.toRow(data);
    const [inserted] = await this.query()
      .insert(row)
      .returning('*');
    return this.mapRowToEntity(inserted as Record<string, unknown>);
  }

  async createMany(data: Partial<T>[]): Promise<T[]> {
    if (data.length === 0) return [];
    const rows = data.map((d) => this.toRow(d));
    const inserted = await this.query()
      .insert(rows)
      .returning('*');
    return (inserted as Record<string, unknown>[]).map((r) =>
      this.mapRowToEntity(r),
    );
  }

  /** Sem where → INSERT; com where → UPDATE. */
  async save(entity: Partial<T>, where?: WhereClause<T>): Promise<T> {
    if (!where || Object.keys(where).length === 0) {
      return this.create(entity);
    }
    const whereRow = this.toRow(where as Partial<T>);
    return this.update(
      whereRow as Partial<T> & { [key: string]: string | number },
      entity,
    );
  }

  async findById(id: string | number): Promise<T | null> {
    const row = await this.query()
      .where(this.primaryKeyColumn, id)
      .first();
    if (!row) return null;
    return this.mapRowToEntity(row as Record<string, unknown>);
  }

  /** find() com FindOptions: select, where, orderBy (objeto), limit, offset, withDeleted. */
  async find(options?: FindOptions<T>): Promise<T[]> {
    let qb = this.query();
    const cols = this.metadata.columns ?? {};
    const selectCols =
      options?.select?.map((p) => this.propToColumn(String(p))) ?? ['*'];
    qb = qb.select(selectCols as [string, ...string[]]);
    if (this.metadata.softDelete && !options?.withDeleted) {
      qb = qb.whereNull(this.metadata.softDelete.columnName);
    }
    if (options?.where && Object.keys(options.where).length > 0) {
      qb = this.applyWhereClause(qb, options.where);
    }
    if (options?.orderBy) {
      for (const [prop, dir] of Object.entries(options.orderBy)) {
        qb = qb.orderBy(this.propToColumn(prop), dir ?? 'asc');
      }
    }
    if (options?.limit) qb = qb.limit(options.limit);
    if (options?.offset) qb = qb.offset(options.offset);
    const rows = await qb;
    return (rows as Record<string, unknown>[]).map((r) =>
      this.mapRowToEntity(r),
    );
  }

  /** findOne(where): where obrigatório, retorna primeiro ou null. */
  async findOne(where: WhereClause<T>): Promise<T | null> {
    const rows = await this.find({ where, limit: 1 });
    return rows[0] ?? null;
  }

  async findMany(options?: FindManyOptions<T>): Promise<T[]> {
    let qb = this.query().select('*');
    if (options?.where && Object.keys(options.where).length > 0) {
      const whereRow = this.toRow(options.where);
      qb = qb.where(whereRow);
    }
    if (options?.limit) qb = qb.limit(options.limit);
    if (options?.offset) qb = qb.offset(options.offset);
    if (options?.orderBy) {
      const col =
        typeof options.orderBy === 'string' &&
        options.orderBy in (this.metadata.columns ?? {})
          ? (this.metadata.columns as Record<string, { columnName: string }>)[
              options.orderBy
            ]?.columnName ?? options.orderBy
          : String(options.orderBy);
      qb = qb.orderBy(col, options.order ?? 'asc');
    }
    const rows = await qb;
    return (rows as Record<string, unknown>[]).map((r) =>
      this.mapRowToEntity(r),
    );
  }

  async update(
    where: Partial<T> | { [key: string]: string | number },
    data: Partial<T>,
  ): Promise<T> {
    const whereRow =
      'id' in where || this.primaryKeyColumn in where
        ? where
        : this.toRow(where as Partial<T>);
    const updateRow = this.toRow(data);
    const [updated] = await this.query()
      .where(whereRow)
      .update(updateRow)
      .returning('*');
    return this.mapRowToEntity(updated as Record<string, unknown>);
  }

  async updateMany(
    where: { ids: (string | number)[] },
    data: Partial<T>,
  ): Promise<number> {
    const updateRow = this.toRow(data);
    const count = await this.query()
      .whereIn(this.primaryKeyColumn, where.ids)
      .update(updateRow);
    return typeof count === 'number' ? count : 0;
  }

  /** Soft delete: seta deleted_at. Requer @SoftDelete() na entidade. */
  async disable(where: WhereClause<T>): Promise<void> {
    if (!this.metadata.softDelete) {
      throw new Error('Entity does not support soft delete');
    }
    const whereRow = this.toRow(where as Partial<T>);
    await this.query()
      .where(whereRow)
      .update({
        [this.metadata.softDelete.columnName]: new Date(),
      });
  }

  async delete(
    where: Partial<T> | { [key: string]: string | number },
  ): Promise<void> {
    const whereRow =
      'id' in where || this.primaryKeyColumn in where
        ? where
        : this.toRow(where as Partial<T>);
    await this.query().where(whereRow).del();
  }

  async deleteMany(where: { ids: (string | number)[] }): Promise<number> {
    const count = await this.query()
      .whereIn(this.primaryKeyColumn, where.ids)
      .del();
    return typeof count === 'number' ? count : 0;
  }

  async paginate(options: PaginateOptions = {}): Promise<PaginateResult<T>> {
    const page = options.page ?? 1;
    const limit = options.limit ?? 10;
    const offset = (page - 1) * limit;

    const [data, countResult] = await Promise.all([
      this.query()
        .select('*')
        .limit(limit)
        .offset(offset)
        .orderBy(
          options.orderBy ?? this.primaryKeyColumn,
          options.order ?? 'desc',
        ),
      this.query().count(`* as count`).first(),
    ]);

    const total = Number((countResult as { count: string } | undefined)?.count ?? 0);
    const totalPages = Math.ceil(total / limit);

    return {
      data: (data as Record<string, unknown>[]).map((r) =>
        this.mapRowToEntity(r),
      ),
      meta: { page, limit, total, totalPages },
    };
  }
}
