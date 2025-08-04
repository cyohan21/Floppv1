import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true, // so you can use Jest-like globals (describe, it, expect)
    environment: 'node',
    include: ['**/*.test.ts', '**/*.serial.test.ts'],
    sequence: {
      concurrent: false
    }
  },
});