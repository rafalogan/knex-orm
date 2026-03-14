import { SchemaBuilder } from './schema/schema-builder';
import { SchemaDiff } from './schema/schema-diff';
import { SchemaRegistry } from './storage/schema-registry';
import { MigrationGenerator } from './migration-generator';
import { MigrationWriter } from './migration-writer';

export interface GenerateOptions {
  entities: (new () => object)[];
  migrationsDir?: string;
  schemaPath?: string;
  migrationName?: string;
}

export interface GenerateResult {
  migrationPath: string | null;
  opsCount: number;
  schemaUpdated: boolean;
}

/**
 * Orquestra geração de migrations: entities → schema → diff → migration.
 */
export class MigrationEngine {
  async generate(options: GenerateOptions): Promise<GenerateResult> {
    const { entities, migrationsDir = 'migrations', schemaPath = '.orm-schema.json', migrationName = 'auto' } = options;

    const builder = new SchemaBuilder();
    const registry = new SchemaRegistry(schemaPath);
    const diff = new SchemaDiff();
    const generator = new MigrationGenerator();
    const writer = new MigrationWriter(migrationsDir);

    const currentSchema = builder.buildFromEntities(entities);
    const previousSchema = await registry.load();
    const ops = diff.diff(currentSchema, previousSchema);

    if (ops.length === 0) {
      return { migrationPath: null, opsCount: 0, schemaUpdated: false };
    }

    const name = migrationName === 'auto' ? this.deriveMigrationName(ops) : migrationName;
    const filename = writer.generateFilename(name);
    const { content } = generator.generate(ops, name);
    const migrationPath = await writer.write(filename, content);

    await registry.save(currentSchema);

    return {
      migrationPath,
      opsCount: ops.length,
      schemaUpdated: true,
    };
  }

  private deriveMigrationName(ops: { type: string; table?: string }[]): string {
    const types = [...new Set(ops.map((o) => o.type))];
    const tables = [...new Set(ops.map((o) => o.table).filter(Boolean))] as string[];
    if (types.length === 1 && ops.length === 1) {
      const op = ops[0];
      if (op && op.type === 'createTable' && op.table) return `create_${op.table}`;
      if (op && op.type === 'dropTable' && op.table) return `drop_${op.table}`;
    }
    return tables.length > 0 ? tables.join('_') : 'schema_update';
  }
}
