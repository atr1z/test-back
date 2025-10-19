import express, { Application, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { AppConfig, ErrorResponse } from './types';

export class AtrizApp {
    public app: Application;
    private config: AppConfig;

    constructor(config: AppConfig) {
        this.app = express();
        this.config = config;
        this.setupMiddleware();
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
        this.app.use((req: Request, res: Response) => {
            res.status(404).json({
                message: 'Route not found',
                statusCode: 404,
            });
        });

        // Global error handler
        this.app.use(
            (
                err: Error & { statusCode?: number },
                req: Request,
                res: Response,
                next: NextFunction
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
        this.app.listen(this.config.port, () => {
            console.log(`🚀 Server running on port ${this.config.port} in ${this.config.env} mode`);
            if (callback) callback();
        });
    }
}
