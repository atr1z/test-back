import express, { Application, Request, Response, NextFunction } from 'express';
import { createServer, Server as HTTPServer } from 'http';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { AppConfig, ErrorResponse, RealtimeConfig } from './types/index.js';
import { RealtimeServer } from './service/realtime.js';

/**
 * Enhanced WebService with WebSocket support
 *
 * Combines Express HTTP server with Socket.io WebSocket server
 * for real-time capabilities like live tracking.
 *
 * @example
 * ```typescript
 * const config = {
 *   port: 3000,
 *   env: 'development',
 *   cors: { origin: 'http://localhost:5173' },
 *   realtime: {
 *     redisUrl: 'redis://localhost:6379',
 *     corsOrigin: 'http://localhost:5173',
 *     jwtSecret: process.env.JWT_SECRET,
 *   }
 * };
 *
 * const webService = new WebServiceWithRealtime(config);
 * webService.listen();
 * ```
 */
export class WebServiceWithRealtime {
    public app: Application;
    public httpServer: HTTPServer;
    public realtimeServer?: RealtimeServer;
    private config: AppConfig & { realtime?: RealtimeConfig };

    constructor(config: AppConfig & { realtime?: RealtimeConfig }) {
        this.config = config;
        this.app = express();
        this.httpServer = createServer(this.app);

        this.setupMiddleware();

        // Initialize realtime server if config provided
        if (config.realtime) {
            this.realtimeServer = new RealtimeServer(
                this.httpServer,
                config.realtime
            );
        }
    }

    private setupMiddleware(): void {
        // Security middleware
        this.app.use(helmet());

        // CORS
        if (this.config.cors) {
            this.app.use(cors(this.config.cors));
        }

        // Compression
        this.app.use(compression());

        // Body parsing
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
    }

    public setupErrorHandling(): void {
        // 404 handler
        this.app.use((_req: Request, res: Response) => {
            res.status(404).json({
                message: 'Route not found',
                statusCode: 404,
            });
        });

        // Global error handler
        this.app.use(
            (
                err: Error & { statusCode?: number },
                _req: Request,
                res: Response,
                _next: NextFunction
            ) => {
                const statusCode = err.statusCode || 500;
                const response: ErrorResponse = {
                    message: err.message || 'Internal Server Error',
                    statusCode,
                };

                if (this.config.env === 'development') {
                    response.stack = err.stack;
                }

                res.status(statusCode).json(response);
            }
        );
    }

    public listen(callback?: () => void): void {
        this.setupErrorHandling();

        this.httpServer.listen(this.config.port, '0.0.0.0', () => {
            console.log(
                `🚀 Server running on port ${this.config.port} in ${this.config.env} mode`
            );

            if (this.realtimeServer) {
                console.log('🔌 WebSocket server enabled');
            }

            if (callback) callback();
        });
    }

    /**
     * Get the Express app instance
     */
    public get expressApp(): Application {
        return this.app;
    }

    /**
     * Get the HTTP server instance
     */
    public get server(): HTTPServer {
        return this.httpServer;
    }

    /**
     * Get the realtime server instance (if enabled)
     */
    public get realtime(): RealtimeServer | undefined {
        return this.realtimeServer;
    }

    /**
     * Close the server and cleanup resources
     */
    public async close(): Promise<void> {
        console.log('🛑 Closing server...');

        if (this.realtimeServer) {
            await this.realtimeServer.close();
        }

        return new Promise(resolve => {
            this.httpServer.close(() => {
                console.log('✓ Server closed');
                resolve();
            });
        });
    }
}
