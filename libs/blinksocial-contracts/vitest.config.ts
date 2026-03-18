import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['libs/blinksocial-contracts/src/**/*.spec.ts'],
  },
});
