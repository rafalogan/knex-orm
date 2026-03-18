import type { MigrationOp } from './schema/schema-diff';
import type { ColumnSchema, TableSchema } from './schema/schema-types';

/**
 * Gera código de migration Knex a partir de operações de diff.
 */
export class MigrationGenerator {
  generate(ops: MigrationOp[], name: string): { content: string; up: string; down: string } {
    const upStatements: string[] = [];
    const downStatements: string[] = [];

    for (const op of ops) {
      switch (op.type) {
        case 'createTable':
          upStatements.push(this.genCreateTable(op.table, op.schema));
          downStatements.unshift(this.genDropTable(op.table));
          break;
        case 'dropTable':
          upStatements.push(this.genDropTable(op.table));
          downStatements.unshift(this.genCreateTablePlaceholder(op.table));
          break;
        case 'addColumn':
          upStatements.push(this.genAddColumn(op.table, op.column));
          downStatements.unshift(this.genDropColumn(op.table, op.column.columnName));
          break;
        case 'dropColumn':
          upStatements.push(this.genDropColumn(op.table, op.column));
          downStatements.unshift(this.genAddColumnPlaceholder(op.table, op.column));
          break;
        case 'alterColumn':
          upStatements.push(this.genAlterColumn(op.table, op.column, op.changes));
          break;
        case 'addIndex':
          upStatements.push(this.genAddIndex(op.table, op.fields));
          downStatements.unshift(this.genDropIndex(op.table, op.fields));
          break;
        case 'dropIndex':
          upStatements.push(this.genDropIndex(op.table, op.fields));
          downStatements.unshift(this.genAddIndex(op.table, op.fields));
          break;
        default:
          break;
      }
    }

    const header = `import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
`;

    const upBody = upStatements.length > 0 ? upStatements.map((s) => `  ${s}`).join('\n') : '  // No changes';

    const downHeader = `
export async function down(knex: Knex): Promise<void> {
`;

    const downBody = downStatements.length > 0 ? downStatements.map((s) => `  ${s}`).join('\n') : '  // No changes';

    const content =
      `// Migration: ${name}\n` + header + upBody + '\n}\n' + downHeader + downBody + '\n}\n';
    return { content, up: upBody, down: downBody };
  }

  private genCreateTable(table: string, schema: TableSchema): string {
    const cols = Object.values(schema.columns);
    const pk = schema.primaryKey;
    const lines: string[] = [];

    lines.push(`await knex.schema.createTable('${table}', (table) => {`);

    for (const col of cols) {
      const isPk = pk?.columnName === col.columnName && pk?.autoincrement;
      if (isPk) {
        lines.push(`  table.increments('${col.columnName}').primary();`);
      } else {
        lines.push('  ' + this.genColumnBuilder(col));
      }
    }

    const indexes = schema.indexes ?? [];
    for (const idx of indexes) {
      const fieldsStr = idx.fields.map((f) => `'${f}'`).join(', ');
      lines.push(`  table.index([${fieldsStr}]);`);
    }

    lines.push('});');
    return lines.join('\n');
  }

  private genColumnBuilder(col: ColumnSchema): string {
    const { columnName, type, nullable, default: def, unique } = col;
    let chain = '';

    switch (type) {
      case 'string':
        chain = `table.string('${columnName}', 255)`;
        break;
      case 'integer':
        chain = `table.integer('${columnName}')`;
        break;
      case 'bigInteger':
        chain = `table.bigInteger('${columnName}')`;
        break;
      case 'boolean':
        chain = `table.boolean('${columnName}')`;
        break;
      case 'text':
        chain = `table.text('${columnName}')`;
        break;
      case 'float':
        chain = `table.float('${columnName}')`;
        break;
      case 'decimal':
        chain = `table.decimal('${columnName}')`;
        break;
      case 'date':
        chain = `table.date('${columnName}')`;
        break;
      case 'datetime':
      case 'timestamp':
        chain = `table.timestamp('${columnName}')`;
        break;
      case 'json':
        chain = `table.json('${columnName}')`;
        break;
      case 'jsonb':
        chain = `table.jsonb('${columnName}')`;
        break;
      case 'uuid':
        chain = `table.uuid('${columnName}')`;
        break;
      default:
        chain = `table.string('${columnName}', 255)`;
    }

    if (nullable === false) chain += '.notNullable()';
    if (unique) chain += '.unique()';
    if (def !== undefined && def !== null) {
      if (def === 'CURRENT_TIMESTAMP') {
        chain += '.defaultTo(knex.fn.now())';
      } else if (typeof def === 'boolean') {
        chain += `.defaultTo(${def})`;
      } else if (typeof def === 'number') {
        chain += `.defaultTo(${def})`;
      } else {
        chain += `.defaultTo('${String(def)}')`;
      }
    }
    chain += ';';
    return chain;
  }

  private genDropTable(table: string): string {
    return `await knex.schema.dropTableIfExists('${table}');`;
  }

  private genCreateTablePlaceholder(table: string): string {
    return `// TODO: recreate table '${table}' - structure not stored in down`;
  }

  private genAddColumn(table: string, col: ColumnSchema): string {
    const builder = this.genColumnBuilder(col);
    return `await knex.schema.alterTable('${table}', (table) => {\n  ${builder}\n});`;
  }

  private genDropColumn(table: string, column: string): string {
    return `await knex.schema.alterTable('${table}', (table) => {\n  table.dropColumn('${column}');\n});`;
  }

  private genAddColumnPlaceholder(table: string, column: string): string {
    return `// TODO: re-add column '${column}' to '${table}'`;
  }

  private genAlterColumn(table: string, column: string, changes: Partial<ColumnSchema>): string {
    return `// TODO: alter column '${column}' in '${table}': ${JSON.stringify(changes)}`;
  }

  private genAddIndex(table: string, fields: string[]): string {
    const fieldsStr = fields.map((f) => `'${f}'`).join(', ');
    return `await knex.schema.alterTable('${table}', (table) => {\n  table.index([${fieldsStr}]);\n});`;
  }

  private genDropIndex(table: string, fields: string[]): string {
    const fieldsStr = fields.map((f) => `'${f}'`).join(', ');
    return `await knex.schema.alterTable('${table}', (table) => {\n  table.dropIndex([${fieldsStr}]);\n});`;
  }
}
