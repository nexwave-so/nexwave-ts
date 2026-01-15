import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['bin/nexwave.ts'],
  format: ['esm'],
  target: 'node18',
  outDir: 'dist/bin',
  clean: true,
  splitting: false,
  sourcemap: true,
  dts: false,
  banner: {
    js: '#!/usr/bin/env node',
  },
  external: [
    'keytar', // Native module - optional dependency
  ],
  noExternal: [
    '@nexwave/sdk',
    '@nexwave/types',
  ],
});
