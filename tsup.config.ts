/**
 * Build dual ESM + CJS for npm publication.
 * Module 13 — Dual Runtime Compatibility (Node.js + Bun).
 */
import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: {
      index: 'src/index.ts',
      'nestjs/index': 'src/nestjs/index.ts',
      'adapters/migration/index': 'src/adapters/migration/index.ts',
      'cli/migrate-generate': 'src/cli/migrate-generate.ts',
    },
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    target: 'node18',
    outDir: 'dist',
    clean: true,
    treeshake: true,
    splitting: false,
    external: ['knex', 'reflect-metadata', '@nestjs/common', '@nestjs/core'],
    noExternal: [],
    esbuildOptions(options) {
      options.platform = 'node';
    },
  },
]);
