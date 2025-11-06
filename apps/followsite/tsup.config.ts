import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/index.ts'],
    format: ['esm'],
    dts: true,
    sourcemap: true,
    clean: true,
    splitting: false,
    treeshake: true,
    outDir: 'dist',
    external: [
        '@atriz/core',
        'express',
        'reflect-metadata',
    ],
    // Bundle to resolve ESM imports properly
    bundle: true,
    // Keep decorator metadata and names for DI
    esbuildOptions(options) {
        options.keepNames = true;
    },
});

