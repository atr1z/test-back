import 'reflect-metadata';
import { AtrizApp, loadEnv, getEnv, getEnvAsNumber, logger } from '@atriz/core';
import { setupContainer } from './di';
import routes from './routes';

// Load environment variables
loadEnv();

// Setup DI container
setupContainer();

// Create app instance
const app = new AtrizApp({
    port: getEnvAsNumber('PORT', 3001),
    env: getEnv('NODE_ENV', 'development'),
    cors: {
        origin: getEnv('CORS_ORIGIN', '*'),
        credentials: true,
    },
});

// Add custom middleware
app.app.use(logger);

// Register routes
app.app.use('/api', routes());

// Health check
app.app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'mextrack-api',
        version: '0.0.0',
        timestamp: new Date().toISOString(),
    });
});

// Start server
app.listen(() => {
    console.log('🚗 Mextrack API ready for fleet tracking');
});
