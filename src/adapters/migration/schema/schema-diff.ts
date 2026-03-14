import type { OrmSchema, TableSchema, ColumnSchema } from './schema-types';

export type MigrationOp =
  | { type: 'createTable'; table: string; schema: TableSchema }
  | { type: 'dropTable'; table: string }
  | { type: 'addColumn'; table: string; column: ColumnSchema }
  | { type: 'dropColumn'; table: string; column: string }
  | { type: 'alterColumn'; table: string; column: string; changes: Partial<ColumnSchema> }
  | { type: 'renameColumn'; table: string; from: string; to: string }
  | { type: 'addIndex'; table: string; fields: string[] }
  | { type: 'dropIndex'; table: string; fields: string[] };

/**
 * Calcula diff entre schema atual e anterior.
 */
export class SchemaDiff {
  diff(current: OrmSchema, previous: OrmSchema | null): MigrationOp[] {
    const ops: MigrationOp[] = [];

    if (!previous) {
      for (const [tableName, tableSchema] of Object.entries(current.tables)) {
        ops.push({ type: 'createTable', table: tableName, schema: tableSchema });
      }
      return ops;
    }

    const prevTables = previous.tables ?? {};

    for (const [tableName, currTable] of Object.entries(current.tables)) {
      const prevTable = prevTables[tableName];
      if (!prevTable) {
        ops.push({ type: 'createTable', table: tableName, schema: currTable });
        continue;
      }
      this.diffTable(ops, tableName, currTable, prevTable);
    }

    for (const tableName of Object.keys(prevTables)) {
      if (!(tableName in current.tables)) {
        ops.push({ type: 'dropTable', table: tableName });
      }
    }

    return ops;
  }

  private diffTable(ops: MigrationOp[], tableName: string, curr: TableSchema, prev: TableSchema): void {
    const prevCols = prev.columns ?? {};
    const currCols = curr.columns ?? {};

    for (const [colName, colSchema] of Object.entries(currCols)) {
      const prevCol = prevCols[colName];
      if (!prevCol) {
        ops.push({ type: 'addColumn', table: tableName, column: colSchema });
      } else if (!this.columnsEqual(prevCol, colSchema)) {
        ops.push({
          type: 'alterColumn',
          table: tableName,
          column: colName,
          changes: this.columnChanges(prevCol, colSchema),
        });
      }
    }

    for (const colName of Object.keys(prevCols)) {
      if (!(colName in currCols)) {
        ops.push({ type: 'dropColumn', table: tableName, column: colName });
      }
    }

    this.diffIndexes(ops, tableName, curr, prev);
  }

  private diffIndexes(ops: MigrationOp[], tableName: string, curr: TableSchema, prev: TableSchema): void {
    const prevIdx = prev.indexes ?? [];
    const currIdx = curr.indexes ?? [];

    const prevKey = (fields: string[]) => [...fields].sort().join(',');
    const currKeys = new Set(currIdx.map((i) => prevKey(i.fields)));

    for (const idx of currIdx) {
      const key = prevKey(idx.fields);
      const exists = prevIdx.some((p) => prevKey(p.fields) === key);
      if (!exists) {
        ops.push({ type: 'addIndex', table: tableName, fields: idx.fields });
      }
    }

    const prevKeys = new Set(prevIdx.map((i) => prevKey(i.fields)));
    for (const idx of prevIdx) {
      const key = prevKey(idx.fields);
      if (!currKeys.has(key)) {
        ops.push({ type: 'dropIndex', table: tableName, fields: idx.fields });
      }
    }
  }

  private columnsEqual(a: ColumnSchema, b: ColumnSchema): boolean {
    return (
      a.type === b.type &&
      (a.nullable ?? false) === (b.nullable ?? false) &&
      String(a.default ?? '') === String(b.default ?? '') &&
      (a.unique ?? false) === (b.unique ?? false)
    );
  }

  private columnChanges(prev: ColumnSchema, curr: ColumnSchema): Partial<ColumnSchema> {
    const changes: Partial<ColumnSchema> = {};
    if (prev.type !== curr.type) changes.type = curr.type;
    const prevNullable = prev.nullable ?? false;
    const currNullable = curr.nullable ?? false;
    if (prevNullable !== currNullable) changes.nullable = currNullable;
    if (String(prev.default ?? '') !== String(curr.default ?? '')) changes.default = curr.default;
    const prevUnique = prev.unique ?? false;
    const currUnique = curr.unique ?? false;
    if (prevUnique !== currUnique) changes.unique = currUnique;
    return changes;
  }
}
