import { SchemaDiff } from '@adapters/migration/schema/schema-diff';
import type { OrmSchema, TableSchema } from '@adapters/migration/schema/schema-types';

describe('SchemaDiff', () => {
  let diff: SchemaDiff;

  beforeEach(() => {
    diff = new SchemaDiff();
  });

  const userTable: TableSchema = {
    tableName: 'users',
    columns: {
      id: { columnName: 'id', type: 'integer', nullable: false },
      email: { columnName: 'email', type: 'string', nullable: false, unique: true },
      name: { columnName: 'name', type: 'string' },
    },
    primaryKey: { columnName: 'id', autoincrement: true },
  };

  it('should return createTable for all tables when previous is null', () => {
    const current: OrmSchema = { version: 1, tables: { users: userTable } };
    const ops = diff.diff(current, null);

    expect(ops).toHaveLength(1);
    expect(ops[0]).toMatchObject({ type: 'createTable', table: 'users' });
    expect((ops[0] as { schema: TableSchema }).schema.tableName).toBe('users');
  });

  it('should return createTable for new table', () => {
    const previous: OrmSchema = { version: 1, tables: {} };
    const current: OrmSchema = { version: 1, tables: { users: userTable } };
    const ops = diff.diff(current, previous);

    expect(ops).toHaveLength(1);
    expect(ops[0]).toMatchObject({ type: 'createTable', table: 'users' });
  });

  it('should return dropTable when table removed from entities', () => {
    const previous: OrmSchema = {
      version: 1,
      tables: { users: userTable, posts: { tableName: 'posts', columns: {} } },
    };
    const current: OrmSchema = { version: 1, tables: { users: userTable } };
    const ops = diff.diff(current, previous);

    expect(ops).toHaveLength(1);
    expect(ops[0]).toMatchObject({ type: 'dropTable', table: 'posts' });
  });

  it('should return addColumn when column added', () => {
    const prevTable: TableSchema = {
      ...userTable,
      columns: { id: userTable.columns.id, email: userTable.columns.email },
    };
    const previous: OrmSchema = { version: 1, tables: { users: prevTable } };
    const current: OrmSchema = { version: 1, tables: { users: userTable } };
    const ops = diff.diff(current, previous);

    expect(ops).toHaveLength(1);
    expect(ops[0]).toMatchObject({
      type: 'addColumn',
      table: 'users',
      column: expect.objectContaining({ columnName: 'name', type: 'string' }),
    });
  });

  it('should return dropColumn when column removed', () => {
    const currTable: TableSchema = {
      ...userTable,
      columns: { id: userTable.columns.id, email: userTable.columns.email },
    };
    const previous: OrmSchema = { version: 1, tables: { users: userTable } };
    const current: OrmSchema = { version: 1, tables: { users: currTable } };
    const ops = diff.diff(current, previous);

    expect(ops).toHaveLength(1);
    expect(ops[0]).toMatchObject({ type: 'dropColumn', table: 'users', column: 'name' });
  });

  it('should return alterColumn when column type changes', () => {
    const prevTable: TableSchema = {
      ...userTable,
      columns: {
        ...userTable.columns,
        name: { columnName: 'name', type: 'string' },
      },
    };
    const currTable: TableSchema = {
      ...userTable,
      columns: {
        ...userTable.columns,
        name: { columnName: 'name', type: 'text' },
      },
    };
    const previous: OrmSchema = { version: 1, tables: { users: prevTable } };
    const current: OrmSchema = { version: 1, tables: { users: currTable } };
    const ops = diff.diff(current, previous);

    expect(ops).toHaveLength(1);
    expect(ops[0]).toMatchObject({
      type: 'alterColumn',
      table: 'users',
      column: 'name',
      changes: { type: 'text' },
    });
  });

  it('should return no ops when schemas are identical', () => {
    const schema: OrmSchema = { version: 1, tables: { users: userTable } };
    const ops = diff.diff(schema, schema);
    expect(ops).toHaveLength(0);
  });
});
