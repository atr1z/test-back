import 'reflect-metadata';
import {
    WebService,
    loadEnv,
    getEnv,
    getEnvAsNumber,
    logger,
} from '@atriz/core';

const { version } = require('../package.json');

// Set timezone to UTC for consistent time handling
process.env.TZ = 'UTC';

// Load environment variables
loadEnv();

// Setup DI container
setupContainer();

// Create app instance
const webService = new WebService({
    port: getEnvAsNumber('PORT', 3000),
    env: getEnv('NODE_ENV', 'development'),
    cors: {
        origin: '*',
        credentials: true,
    },
});

// Add custom middleware
webService.app.use(logger);

// Register routes
webService.app.use('/api', routes());

// Health check
webService.app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'atriz-api',
        version,
        timestamp: new Date().toISOString(),
    });
});

// Start server
webService.listen();
