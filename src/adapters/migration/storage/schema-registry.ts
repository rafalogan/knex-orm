import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { OrmSchema } from '../schema/schema-types';

const DEFAULT_SCHEMA_FILE = '.orm-schema.json';

/**
 * Carrega e salva schema ORM em JSON (estado anterior para diff).
 */
export class SchemaRegistry {
  constructor(private readonly schemaPath: string = DEFAULT_SCHEMA_FILE) {}

  async load(): Promise<OrmSchema | null> {
    try {
      const content = await readFile(this.schemaPath, 'utf-8');
      const parsed = JSON.parse(content) as OrmSchema;
      return this.validateSchema(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  async save(schema: OrmSchema): Promise<void> {
    const dir = dirname(this.schemaPath);
    await mkdir(dir, { recursive: true });
    await writeFile(
      this.schemaPath,
      JSON.stringify({ ...schema, generatedAt: new Date().toISOString() }, null, 2),
      'utf-8',
    );
  }

  private validateSchema(schema: unknown): schema is OrmSchema {
    if (!schema || typeof schema !== 'object') return false;
    const s = schema as Record<string, unknown>;
    return (
      typeof s.version === 'number' &&
      s.tables !== null &&
      typeof s.tables === 'object'
    );
  }
}
