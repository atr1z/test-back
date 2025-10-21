import 'reflect-metadata';
import { WebService, loadEnv, getEnv, getEnvAsNumber, logger } from '@atriz/core';
import { setupContainer } from './di';
import { setupStorage } from './di/setupStorage';
import routes from './routes';

// Load environment variables
loadEnv();

// Setup DI container
setupContainer();

// Setup storage provider
setupStorage();

// Create app instance
const webService = new WebService({
    port: getEnvAsNumber('PORT', 3002),
    env: getEnv('NODE_ENV', 'development'),
    cors: {
        origin: getEnv('CORS_ORIGIN', '*'),
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
        service: 'pshop-api',
        version: '0.0.0',
        timestamp: new Date().toISOString(),
    });
});

// Start server
webService.listen(() => {
    console.log('🛒 PShop API ready for point of sale operations');
});
