import 'reflect-metadata';
import { WebService, loadEnv, getEnv, getEnvAsNumber, logger } from '@atriz/core';
import { setupContainer } from './di';
import routes from './routes';

const { version } = require('../package.json');

// Set timezone to UTC for consistent time handling
process.env.TZ = 'UTC';

// Load environment variables
loadEnv();

// Setup DI container
setupContainer();

// Create app instance
const service = new WebService({
    port: getEnvAsNumber('PORT', 3001),
    env: getEnv('NODE_ENV', 'development'),
    cors: {
        origin: getEnv('CORS_ORIGIN', '*'),
        credentials: true,
    },
});

// Add custom middleware
service.app.use(logger);

// Register routes
service.app.use('/api', routes());

// Health check
service.app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'mextrack-api',
        version,
        timestamp: new Date().toISOString(),
    });
});

// Start server
service.listen(() => {
    console.log('🚗 Mextrack API ready for fleet tracking');
});
