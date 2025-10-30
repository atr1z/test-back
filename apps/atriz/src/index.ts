import 'reflect-metadata';
import { Request, Response } from 'express';
import {
    WebService,
    loadEnv,
    getEnv,
    getEnvAsNumber,
    logger,
} from '@atriz/core';
import { setupContainer } from './di/index.js';
import routes from './routes/index.js';

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(
    readFileSync(join(__dirname, '../package.json'), 'utf8')
);
const { version } = packageJson;

// Set timezone to UTC for consistent time handling
process.env.TZ = 'UTC';

// Load environment variables
loadEnv();

// Setup DI container
setupContainer();

// Create app instance
const webService = new WebService({
    port: getEnvAsNumber('PORT', 3001),
    env: getEnv('NODE_ENV', 'development'),
    cors: {
        origin: '*',
        credentials: true,
    },
});

// Add custom middleware
webService.app.use(logger);

// Register routes
webService.app.use('/v1', routes());

// Health check
webService.app.get('/v1/health', (_req: Request, res: Response) => {
    res.json({
        status: 'ok',
        service: 'atriz-backend',
        version,
        timestamp: new Date().toISOString(),
    });
});

// Start server
webService.listen();
