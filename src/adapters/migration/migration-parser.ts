import { createRequire } from 'node:module';
import { resolve } from 'node:path';

export interface ParsedColumn {
  name: string;
  type: string;
  nullable?: boolean;
  primary?: boolean;
  unique?: boolean;
  defaultValue?: unknown;
}

export interface ParsedForeignKey {
  column: string;
  referencedTable: string;
  referencedColumn: string;
}

export interface ParsedIndex {
  columns: string[];
  unique: boolean;
}

export interface ParsedTable {
  tableName: string;
  columns: ParsedColumn[];
  foreignKeys: ParsedForeignKey[];
  indexes: ParsedIndex[];
}

type ColumnBuilder = {
  name: string;
  type: string;
  nullable?: boolean;
  primary?: boolean;
  unique?: boolean;
  defaultValue?: unknown;
  referencedTable?: string;
  referencedColumn?: string;
};

class RecordingSchemaBuilder {
  tableName: string | null = null;
  columns: ColumnBuilder[] = [];
  indexes: ParsedIndex[] = [];

  createTable(name: string, cb: (table: RecordingTableBuilder) => void): void {
    this.tableName = name;
    const table = new RecordingTableBuilder(this);
    cb(table);
  }
}

class RecordingTableBuilder {
  private readonly schema: RecordingSchemaBuilder;

  constructor(schema: RecordingSchemaBuilder) {
    this.schema = schema;
  }

  private addColumn(name: string, type: string): ColumnBuilder {
    const col: ColumnBuilder = { name, type };
    this.schema.columns.push(col);
    return col;
  }

  increments(name: string): ColumnBuilder {
    const col = this.addColumn(name, 'integer');
    col.primary = true;
    col.nullable = false;
    return col;
  }

  integer(name: string): ColumnBuilder {
    return this.addColumn(name, 'integer');
  }

  bigInteger(name: string): ColumnBuilder {
    return this.addColumn(name, 'bigInteger');
  }

  string(name: string): ColumnBuilder {
    return this.addColumn(name, 'string');
  }

  text(name: string): ColumnBuilder {
    return this.addColumn(name, 'text');
  }

  boolean(name: string): ColumnBuilder {
    return this.addColumn(name, 'boolean');
  }

  timestamp(name: string): ColumnBuilder {
    return this.addColumn(name, 'timestamp');
  }

  date(name: string): ColumnBuilder {
    return this.addColumn(name, 'date');
  }

  // allow table.primary(['col']) style

  primary(columns?: string | string[]): this {
    const cols = Array.isArray(columns) ? columns : columns ? [columns] : [];
    if (cols.length === 0) return this;
    for (const c of this.schema.columns) {
      if (cols.includes(c.name)) {
        c.primary = true;
        c.nullable = false;
      }
    }
    return this;
  }

  unique(columns: string | string[]): this {
    const cols = Array.isArray(columns) ? columns : [columns];
    this.schema.indexes.push({ columns: cols, unique: true });
    for (const c of this.schema.columns) {
      if (cols.includes(c.name)) {
        c.unique = true;
      }
    }
    return this;
  }

  index(columns: string | string[]): this {
    const cols = Array.isArray(columns) ? columns : [columns];
    this.schema.indexes.push({ columns: cols, unique: false });
    return this;
  }

  notNullable(this: ColumnBuilder): ColumnBuilder {
    this.nullable = false;
    return this;
  }

  nullable(this: ColumnBuilder): ColumnBuilder {
    this.nullable = true;
    return this;
  }

  defaultTo(this: ColumnBuilder, value: unknown): ColumnBuilder {
    this.defaultValue = value;
    return this;
  }

  references(this: ColumnBuilder, column: string): ColumnBuilder {
    this.referencedColumn = column;
    return this;
  }

  inTable(this: ColumnBuilder, table: string): ColumnBuilder {
    this.referencedTable = table;
    return this;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onDelete(this: ColumnBuilder, _action: string): ColumnBuilder {
    return this;
  }
}

export class MigrationParser {
  async parse(path: string): Promise<ParsedTable> {
    const absolute = resolve(path);
    const schema = new RecordingSchemaBuilder();

    const fakeKnex = {
      schema,
    } as unknown as { schema: RecordingSchemaBuilder };

    const req = createRequire(resolve(process.cwd(), 'package.json'));

    const mod = req(absolute) as { up?: (knex: typeof fakeKnex) => Promise<void> | void };
    if (!mod.up || typeof mod.up !== 'function') {
      throw new Error(`Migration ${path} does not export an up() function`);
    }

    const maybePromise = mod.up(fakeKnex as never);
    if (maybePromise && typeof (maybePromise as Promise<void>).then === 'function') {
      await maybePromise;
    }

    if (!schema.tableName) {
      throw new Error(`Migration ${path} did not call schema.createTable`);
    }

    const columns: ParsedColumn[] = schema.columns.map((c) => {
      const col: ParsedColumn = {
        name: c.name,
        type: c.type,
        defaultValue: c.defaultValue,
      };
      if (c.nullable !== undefined) {
        col.nullable = c.nullable;
      }
      if (c.primary !== undefined) {
        col.primary = c.primary;
      }
      if (c.unique !== undefined) {
        col.unique = c.unique;
      }
      return col;
    });

    const foreignKeys: ParsedForeignKey[] = schema.columns
      .filter((c) => c.referencedTable && c.referencedColumn)
      .map((c) => ({
        column: c.name,
        referencedTable: c.referencedTable as string,
        referencedColumn: c.referencedColumn as string,
      }));

    return {
      tableName: schema.tableName,
      columns,
      foreignKeys,
      indexes: schema.indexes,
    };
  }
}
