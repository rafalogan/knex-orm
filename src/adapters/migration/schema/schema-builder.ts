import { getEntityMetadata } from '@core/decorators';
import type { EntityMetadata } from '@core/types/entity-metadata';
import type { OrmSchema, TableSchema, ColumnSchema } from './schema-types';

/**
 * Constrói schema ORM a partir de metadados das entidades.
 */
export class SchemaBuilder {
  buildFromEntities(entities: (new () => object)[]): OrmSchema {
    const tables: Record<string, TableSchema> = {};

    for (const entity of entities) {
      const meta = getEntityMetadata(entity);
      if (!meta?.tableName) continue;

      const table = this.buildTableSchema(meta);
      tables[meta.tableName] = table;
    }

    return {
      version: 1,
      tables,
      generatedAt: new Date().toISOString(),
    };
  }

  private buildTableSchema(meta: EntityMetadata): TableSchema {
    const columns: Record<string, ColumnSchema> = {};
    const cols = meta.columns ?? {};

    for (const [prop, colMeta] of Object.entries(cols)) {
      const col: ColumnSchema = {
        columnName: colMeta.columnName,
        type: colMeta.type,
      };
      if (colMeta.nullable !== undefined) col.nullable = colMeta.nullable;
      if (colMeta.default !== undefined) col.default = colMeta.default;
      if (colMeta.unique !== undefined) col.unique = colMeta.unique;
      if (colMeta.index !== undefined) col.index = colMeta.index;
      columns[colMeta.columnName] = col;
    }

    if (meta.primaryKey) {
      const pkCol = meta.primaryKey.columnName;
      if (!columns[pkCol]) {
        const pkType = meta.primaryKey.options?.uuid ? 'uuid' : 'integer';
        columns[pkCol] = {
          columnName: pkCol,
          type: pkType,
          nullable: false,
          unique: true,
        };
      }
    }

    const table: TableSchema = { tableName: meta.tableName, columns };
    if (meta.primaryKey) {
      table.primaryKey = {
        columnName: meta.primaryKey.columnName,
        autoincrement: meta.primaryKey.options?.autoincrement ?? true,
      };
    }
    if (meta.indexes && meta.indexes.length > 0) table.indexes = meta.indexes;
    return table;
  }
}
