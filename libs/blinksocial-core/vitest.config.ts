import * as path from 'node:path';
import { defineConfig } from 'vitest/config';

const repoRoot = path.resolve(__dirname, '../..');

export default defineConfig({
  resolve: {
    alias: {
      '@blinksocial/contracts': path.resolve(
        repoRoot,
        'libs/blinksocial-contracts/src/index.ts',
      ),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['libs/blinksocial-core/src/**/*.spec.ts'],
  },
});
