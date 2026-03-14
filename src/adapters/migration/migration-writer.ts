import { writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

/**
 * Escreve arquivo de migration no disco.
 */
export class MigrationWriter {
  constructor(
    private readonly migrationsDir: string = 'migrations',
    private readonly extension: string = '.ts',
  ) {}

  async write(filename: string, content: string): Promise<string> {
    const fullPath = `${this.migrationsDir}/${filename}${this.extension}`;
    const dir = dirname(fullPath);
    await mkdir(dir, { recursive: true });
    await writeFile(fullPath, content, 'utf-8');
    return fullPath;
  }

  generateFilename(name: string): string {
    const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
    const safeName = name.replace(/[^a-z0-9_]/gi, '_').toLowerCase();
    return `${timestamp}_${safeName}`;
  }
}
