import { defineConfig } from 'vitest/config';
import path from 'path';
import swc from 'unplugin-swc';

export default defineConfig({
  plugins: [
    swc.vite({
      module: { type: 'es6' },
      jsc: {
        parser: { syntax: 'typescript', decorators: true },
        transform: {
          legacyDecorator: true,
          decoratorMetadata: true,
        },
      },
    }),
  ],
  resolve: {
    alias: {
      '@blinksocial/contracts/validation': path.resolve(
        __dirname,
        '../../libs/blinksocial-contracts/src/lib/workspace/validation.ts'
      ),
      '@blinksocial/contracts': path.resolve(
        __dirname,
        '../../libs/blinksocial-contracts/src/index.ts'
      ),
      '@blinksocial/models': path.resolve(
        __dirname,
        '../../libs/blinksocial-models/src/index.ts'
      ),
      '@blinksocial/core': path.resolve(
        __dirname,
        '../../libs/blinksocial-core/src/index.ts'
      ),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['apps/blinksocial-api/src/**/*.spec.ts'],
  },
});
