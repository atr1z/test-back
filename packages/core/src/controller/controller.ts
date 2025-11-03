import { Response } from 'express';
import {
    ControllerRequest,
    ResponseData,
    HttpStatus,
    ParamDefinition,
    ValidatedParams,
    ValidationResult,
} from '../types';
import { ParamValidator } from '../validators';
import { createChildLogger } from '../utils/logger';
import { Logger } from 'pino';

/**
 * Base Controller class that provides common functionality for all endpoints
 * Inspired by the abstract Endpoint pattern but more flexible and modular
 */
export abstract class BaseController<TServices = any> {
    protected userId?: number;
    protected roleId?: number;
    protected user?: any;
    protected params: ValidatedParams = {};
    protected urlParams: Record<string, string> = {};
    protected requiresAuth: boolean = true;
    protected logger: Logger;

    constructor(
        protected req: ControllerRequest,
        protected res: Response,
        protected services?: TServices
    ) {
        // Extract URL params
        this.urlParams = req.params ? { ...req.params } : {};

        // Extract user info from request (set by auth middleware)
        if (this.req.user) {
            this.userId = this.req.user.userId;
            this.roleId = this.req.user.roleId;
            this.user = this.req.user;
        }

        // Extract body params
        this.params = this.req.body || {};

        // Initialize logger with request context
        // Use req.log if available (from http-logger middleware), otherwise create child logger
        this.logger =
            req.log ||
            createChildLogger({
                controller: this.constructor.name,
                requestId: req.id,
                userId: this.userId,
                path: req.path,
            });
    }

    /**
     * Define required and optional parameters for this endpoint
     * Override this in child classes to define validation rules
     */
    protected abstract defineParams(): ParamDefinition[];

    /**
     * Main business logic of the endpoint
     * Override this in child classes
     */
    protected abstract execute(): Promise<any>;

    /**
     * Optional setup hook that runs before validation
     * Override this in child classes if needed
     */
    protected async setup(): Promise<void> {
        // Default: no setup needed
    }

    /**
     * Main entry point for the controller
     * Handles the full request lifecycle
     */
    public async handle(): Promise<Response> {
        try {
            // Run setup
            await this.setup();

            // Check authentication
            if (this.requiresAuth && !this.userId) {
                return this.unauthorized('Authentication required');
            }

            // Validate parameters
            const paramDefinitions = this.defineParams();
            const validationErrors = await ParamValidator.validateParams(
                this.params,
                paramDefinitions
            );

            if (validationErrors.length > 0) {
                return this.validationError(validationErrors);
            }

            // Execute business logic
            const result = await this.execute();

            // If execute() returned a Response object (e.g., from this.created(), this.unauthorized(), etc.)
            // return it directly. Otherwise, wrap it in a success response.
            if (
                result &&
                typeof result === 'object' &&
                'status' in result &&
                'json' in result
            ) {
                return result as Response;
            }

            // Return success response
            return this.success(result);
        } catch (error) {
            return this.handleError(error);
        }
    }

    /**
     * Success response helper
     */
    protected success<T = any>(
        data?: T,
        message?: string,
        statusCode: HttpStatus = HttpStatus.OK
    ): Response {
        const response: ResponseData<T> = {
            success: true,
            data: data || undefined,
            message: message || undefined,
            meta: {
                timestamp: new Date().toISOString(),
                path: this.req.path,
            },
        };

        return this.res.status(statusCode).json(response);
    }

    /**
     * Error response helper
     */
    protected error(
        message: string,
        statusCode: HttpStatus = HttpStatus.BadRequest,
        errors?: string[]
    ): Response {
        const response: ResponseData = {
            success: false,
            message,
            errors: errors || undefined,
            meta: {
                timestamp: new Date().toISOString(),
                path: this.req.path,
            },
        };

        return this.res.status(statusCode).json(response);
    }

    /**
     * Validation error response
     */
    protected validationError(validationResults: ValidationResult[]): Response {
        const errors = validationResults.map(r => r.message);
        return this.error(
            'Validation failed',
            HttpStatus.UnprocessableEntity,
            errors
        );
    }

    /**
     * Unauthorized response
     */
    protected unauthorized(message: string = 'Unauthorized'): Response {
        return this.error(message, HttpStatus.Unauthorized);
    }

    /**
     * Forbidden response
     */
    protected forbidden(message: string = 'Forbidden'): Response {
        return this.error(message, HttpStatus.Forbidden);
    }

    /**
     * Not found response
     */
    protected notFound(message: string = 'Resource not found'): Response {
        return this.error(message, HttpStatus.NotFound);
    }

    /**
     * Conflict response
     */
    protected conflict(message: string = 'Resource already exists'): Response {
        return this.error(message, HttpStatus.Conflict);
    }

    /**
     * Created response
     */
    protected created<T = any>(data?: T, message?: string): Response {
        return this.success(
            data,
            message || 'Resource created successfully',
            HttpStatus.Created
        );
    }

    /**
     * No content response
     */
    protected noContent(): Response {
        return this.res.status(HttpStatus.NoContent).send();
    }

    /**
     * Error handler
     */
    protected handleError(error: any): Response {
        // Log error with context using structured logging
        this.logger.error(
            {
                error:
                    error instanceof Error
                        ? {
                              message: error.message,
                              stack: error.stack,
                              name: error.name,
                          }
                        : error,
                controller: this.constructor.name,
                userId: this.userId,
                path: this.req.path,
                method: this.req.method,
            },
            'Controller error occurred'
        );

        if (error.statusCode && error.message) {
            return this.error(error.message, error.statusCode);
        }

        return this.error(
            'An unexpected error occurred',
            HttpStatus.InternalServerError
        );
    }

    /**
     * Get client IP address
     */
    protected getClientIp(): string {
        const forwarded = this.req.headers['x-forwarded-for'] as string;
        const ip = forwarded
            ? forwarded.split(',')[0]?.trim() || ''
            : this.req.ip || '';
        return ip;
    }

    /**
     * Get a specific parameter with type safety
     */
    protected getParam<T = any>(name: string, defaultValue?: T): T {
        return (this.params[name] as T) ?? (defaultValue as T);
    }

    /**
     * Get a URL parameter
     */
    protected getUrlParam(name: string, defaultValue?: string): string {
        return this.urlParams[name] ?? defaultValue ?? '';
    }

    /**
     * Check if user has permission (override in child classes)
     */
    protected async hasPermission(_permission: string): Promise<boolean> {
        // Default implementation - override in child classes
        return true;
    }

    /**
     * Get uploaded file from request (single file upload)
     */
    protected getFile(fieldName?: string): File | undefined {
        if (fieldName) {
            const files = (this.req as any).files;
            if (files && files[fieldName] && Array.isArray(files[fieldName])) {
                return files[fieldName][0];
            }
        }
        return (this.req as any).file;
    }

    /**
     * Get multiple uploaded files from request
     */
    protected getFiles(fieldName?: string): File[] {
        if (fieldName) {
            const files = (this.req as any).files;
            return (files?.[fieldName] as File[]) || [];
        }

        const files = (this.req as any).files;
        if (Array.isArray(files)) {
            return files as File[];
        }
        return [];
    }

    /**
     * Check if a file was uploaded
     */
    protected hasFile(fieldName?: string): boolean {
        return !!this.getFile(fieldName);
    }

    /**
     * Check if files were uploaded
     */
    protected hasFiles(fieldName?: string): boolean {
        const files = this.getFiles(fieldName);
        return files.length > 0;
    }
}
