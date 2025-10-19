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
    port: getEnvAsNumber('PORT', 3000),
    env: getEnv('NODE_ENV', 'development'),
    cors: {
        origin: '*',
        credentials: true,
    },
});

// Add custom middleware
app.app.use(logger);

// Register routes
app.app.use('/api', routes());

// Health check
app.app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen();
