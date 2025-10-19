import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { logger } from '@mextrack/utils';
import routes from './routes';
import { errorHandler } from './middleware/error-handler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'pshop-api',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api', routes);

// Error handling
app.use(errorHandler);

// Start server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    logger.info(`PShop API listening on port ${PORT}`);
  });
}

export { app };
