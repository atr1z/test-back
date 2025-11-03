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
    tsconfig: './tsconfig.build.json',
    external: [
        'express',
        'pg',
        'ioredis',
        'socket.io',
        'bcryptjs',
        'jsonwebtoken',
        'multer',
        'mime-types',
        'minio',
        '@aws-sdk/client-s3',
        '@aws-sdk/s3-request-presigner',
        '@socket.io/redis-adapter',
        'tsyringe',
        'reflect-metadata',
        'compression',
        'cors',
        'helmet',
        'dotenv',
    ],
    // Bundle to resolve ESM imports properly
    bundle: true,
    // Keep decorator metadata and names for DI
    esbuildOptions(options) {
        options.keepNames = true;
    },
});
