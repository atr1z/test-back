import 'reflect-metadata';
import { Request, Response } from 'express';
import { setupContainer } from './di';
import routes from './routes';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import {
    WebService,
    loadEnv,
    getEnv,
    getEnvAsNumber,
    httpLogger,
} from '@atriz/core';

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

// Add HTTP logger middleware (with request ID correlation)
webService.app.use(httpLogger);

// Register routes
webService.app.use('/' + getEnv('VERSION', 'v1'), routes());

// Health check endpoint
webService.app.get(
    '/' + getEnv('VERSION', 'v1') + '/health',
    (req: Request, res: Response) => {
        (req as any).log?.info('Health check requested');
        res.json({
            status: 'ok',
            service: 'atriz-backend',
            version,
            timestamp: new Date().toISOString(),
        });
    }
);

// Start server
webService.listen();
