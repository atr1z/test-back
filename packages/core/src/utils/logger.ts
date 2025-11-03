import pino from 'pino';

/**
 * Environment-aware logger configuration
 * - Development: Pretty printed, colorful output
 * - Production: JSON formatted, optimized for log aggregation
 */
const isDevelopment = process.env['NODE_ENV'] !== 'production';

/**
 * Create the base Pino logger instance
 */
export const logger = pino({
    level: process.env['LOG_LEVEL'] || (isDevelopment ? 'debug' : 'info'),
    ...(isDevelopment
        ? {
              transport: {
                  target: 'pino-pretty',
                  options: {
                      colorize: true,
                      translateTime: 'HH:MM:ss',
                      ignore: 'pid,hostname',
                      singleLine: false,
                      messageFormat: '{msg}',
                  },
              },
          }
        : {}),
    formatters: {
        level: label => {
            return { level: label };
        },
    },
    base: {
        env: process.env['NODE_ENV'] || 'development',
    },
    timestamp: pino.stdTimeFunctions.isoTime,
});

/**
 * Create a child logger with additional context
 * Useful for adding scope-specific information to logs
 *
 * @example
 * ```typescript
 * const userLogger = createChildLogger({ userId: '123', module: 'auth' });
 * userLogger.info('User logged in');
 * // Output includes userId and module context
 * ```
 */
export function createChildLogger(context: Record<string, any>): pino.Logger {
    return logger.child(context);
}

/**
 * Convenience methods for common logging patterns
 */
export const log = {
    /**
     * Log trace level message (most verbose)
     */
    trace: (obj: any, msg?: string) => logger.trace(obj, msg),

    /**
     * Log debug level message (development details)
     */
    debug: (obj: any, msg?: string) => logger.debug(obj, msg),

    /**
     * Log info level message (general information)
     */
    info: (obj: any, msg?: string) => logger.info(obj, msg),

    /**
     * Log warning level message (potential issues)
     */
    warn: (obj: any, msg?: string) => logger.warn(obj, msg),

    /**
     * Log error level message (errors that need attention)
     */
    error: (obj: any, msg?: string) => logger.error(obj, msg),

    /**
     * Log fatal level message (critical errors)
     */
    fatal: (obj: any, msg?: string) => logger.fatal(obj, msg),
};

/**
 * Helper to log errors with stack traces
 */
export function logError(
    error: Error | unknown,
    context?: Record<string, any>
) {
    const errorInfo =
        error instanceof Error
            ? {
                  message: error.message,
                  stack: error.stack,
                  name: error.name,
                  ...context,
              }
            : {
                  error: String(error),
                  ...context,
              };

    logger.error(errorInfo);
}

/**
 * Helper to log performance metrics
 */
export function logPerformance(
    operation: string,
    durationMs: number,
    context?: Record<string, any>
) {
    logger.info(
        {
            operation,
            durationMs,
            ...context,
        },
        `${operation} completed in ${durationMs}ms`
    );
}

export default logger;
