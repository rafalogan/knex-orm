import type { ParsedTable, ParsedColumn } from './migration-parser';

function toPascalCase(value: string): string {
  return value
    .split(/[_\s]+/)
    .filter((part) => part.length > 0)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

function mapColumnTypeToTs(column: ParsedColumn): string {
  const t = column.type;
  if (t === 'integer' || t === 'bigInteger' || t === 'float' || t === 'decimal') return 'number';
  if (t === 'boolean') return 'boolean';
  if (t === 'timestamp' || t === 'date' || t === 'datetime') return 'Date';
  return 'string';
}

function isCreatedAt(column: ParsedColumn): boolean {
  return column.name === 'created_at';
}

function isUpdatedAt(column: ParsedColumn): boolean {
  return column.name === 'updated_at';
}

function isDeletedAt(column: ParsedColumn): boolean {
  return column.name === 'deleted_at';
}

export class EntityFromMigrationGenerator {
  generate(table: ParsedTable): string {
    const className = toPascalCase(table.tableName);

    const imports = [
      'Entity',
      'PrimaryKey',
      'Column',
      'CreatedAt',
      'UpdatedAt',
      'SoftDelete',
    ];

    const importLine = `import { ${imports.join(', ')} } from 'knx-orm';`;

    const lines: string[] = [];
    lines.push(importLine, '');
    lines.push(`@Entity('${table.tableName}')`);
    lines.push(`export class ${className} {`);

    for (const col of table.columns) {
      if (isCreatedAt(col)) {
        lines.push('  @CreatedAt()');
        lines.push('  createdAt!: Date;');
        lines.push('');
        continue;
      }
      if (isUpdatedAt(col)) {
        lines.push('  @UpdatedAt()');
        lines.push('  updatedAt!: Date;');
        lines.push('');
        continue;
      }
      if (isDeletedAt(col)) {
        lines.push('  @SoftDelete()');
        lines.push('  deletedAt?: Date;');
        lines.push('');
        continue;
      }

      const tsType = mapColumnTypeToTs(col);
      const optional = col.nullable === true;

      if (col.primary) {
        lines.push('  @PrimaryKey()');
        lines.push(`  ${col.name}!: ${tsType};`);
        lines.push('');
        continue;
      }

      const columnOptions: string[] = [`type: '${tsType === 'number' ? 'integer' : tsType === 'Date' ? 'timestamp' : 'string'}'`];
      if (optional) columnOptions.push('nullable: true');
      if (col.unique) columnOptions.push('unique: true');

      lines.push(`  @Column({ ${columnOptions.join(', ')} })`);
      const propType = optional ? `${tsType} | null` : tsType;
      const propOptional = optional ? '?' : '!';
      lines.push(`  ${col.name}${propOptional}: ${propType};`);
      lines.push('');
    }

    lines.push('}');
    return lines.join('\n');
  }
}

