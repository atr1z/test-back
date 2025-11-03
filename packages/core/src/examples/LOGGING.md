# Enhanced Logging System

The Atriz backend uses **Pino**, a high-performance, structured logging library that provides powerful debugging capabilities during development and production-ready JSON logs for monitoring and analysis.

## Quick Start

### In Controllers

Controllers automatically have access to `this.logger` with request context:

```typescript
export class MyController extends BaseController {
    protected async execute() {
        this.logger.info({ userId: this.userId }, 'Processing request');

        try {
            const result = await this.service.doSomething();
            this.logger.debug({ result }, 'Operation completed');
            return result;
        } catch (error) {
            // Error is automatically logged by handleError()
            throw error;
        }
    }
}
```

### In Models

Models automatically have access to `this.logger` with model context:

```typescript
export class User extends BaseModel {
    protected async beforeCreate() {
        this.logger.info({ email: this.email }, 'Creating new user');
        this.passwordHash = await hashPassword(this.passwordHash);
    }
}
```

### In Services/Repositories

Create a child logger for context:

```typescript
import { createChildLogger } from '@atriz/core';

export class PaymentService {
    private logger = createChildLogger({ service: 'PaymentService' });

    async processPayment(orderId: string) {
        this.logger.info({ orderId }, 'Processing payment');
        // ... payment logic
    }
}
```

### Anywhere Else

Use the default logger:

```typescript
import { logger, log } from '@atriz/core';

logger.info({ event: 'startup' }, 'Application started');

// Or use convenience methods
log.info({ userId: '123' }, 'User action');
log.warn({ usage: 95 }, 'High CPU usage');
log.error({ error: err }, 'Something failed');
```

## Key Features

### 1. Automatic HTTP Request Logging

All HTTP requests are automatically logged with:

- Request ID (X-Request-ID header)
- Method, path, status code
- Response time
- User ID (if authenticated)

### 2. Request-Scoped Logging

Use `req.log` in routes to log with request context:

```typescript
app.get('/users/:id', (req, res) => {
    (req as any).log?.info('Fetching user');
    // This log includes the request ID automatically
});
```

### 3. Environment-Aware Output

- **Development**: Pretty, colored output for easy reading
- **Production**: JSON format for log aggregation tools

### 4. Built-in Error Tracking

Errors in controllers are automatically logged with full context including:

- Error message and stack trace
- Controller name
- User ID
- Request path and method

### 5. Child Loggers for Context

Create child loggers to add persistent context:

```typescript
const userLogger = createChildLogger({
    module: 'user-management',
    userId: '123',
});

// All logs from this logger include module and userId
userLogger.info('Updating profile');
userLogger.debug('Validation passed');
```

## Log Levels

From most to least verbose:

| Level   | Usage                    | Example                                   |
| ------- | ------------------------ | ----------------------------------------- |
| `trace` | Ultra-detailed debugging | Variable values during loops              |
| `debug` | Detailed debugging info  | SQL queries, function inputs/outputs      |
| `info`  | General information      | User actions, business events             |
| `warn`  | Potential issues         | High resource usage, deprecated API usage |
| `error` | Handled errors           | Failed API calls, validation errors       |
| `fatal` | Critical failures        | Database connection lost, cannot start    |

Set the log level with environment variable:

```bash
LOG_LEVEL=debug  # development
LOG_LEVEL=info   # production (default)
```

## Best Practices

### ✅ DO

- **Always include context**: `logger.info({ userId: '123' }, 'User logged in')`
- **Use structured data**: Pass objects as the first argument
- **Use appropriate log levels**: Don't log everything as `error`
- **Log business events**: User signups, purchases, important actions
- **Log performance metrics**: Response times, query durations
- **Use child loggers**: Maintain context across related operations

### ❌ DON'T

- **Never log sensitive data**: Passwords, tokens, credit cards
- **Don't log just strings**: `logger.info('Something happened')` ← bad
- **Don't over-log**: Avoid logging every variable in production
- **Don't use console.log**: Use the structured logger instead
- **Don't log errors twice**: Controllers handle it automatically

## Integration with Third-Party Services

See [`logger.integration.md`](./logger.integration.md) for detailed guides on integrating with:

- **Sentry** - Error tracking and monitoring
- **Datadog** - APM and log aggregation
- **New Relic** - Full-stack observability
- **Custom transports** - Send logs anywhere

## Examples

See [`logger.examples.md`](./logger.examples.md) for comprehensive examples of:

- Controller logging patterns
- Model lifecycle logging
- Service and repository logging
- Middleware logging
- Error logging
- Performance monitoring

## Log Output

### Development Mode

```
[12:34:56] INFO: User logged in
    userId: "123"
    email: "user@example.com"
    requestId: "req_abc123"

[12:34:57] ERROR: Payment failed
    orderId: "ord_456"
    error: {
      message: "Insufficient funds"
      stack: "Error: Insufficient funds\n    at ..."
    }
```

### Production Mode

```json
{"level":"info","time":"2024-11-03T12:34:56.789Z","userId":"123","email":"user@example.com","requestId":"req_abc123","msg":"User logged in"}
{"level":"error","time":"2024-11-03T12:34:57.123Z","orderId":"ord_456","error":{"message":"Insufficient funds","stack":"Error..."},"msg":"Payment failed"}
```

## Environment Variables

```bash
# Required
NODE_ENV=development|production

# Optional
LOG_LEVEL=trace|debug|info|warn|error|fatal  # Default: debug (dev), info (prod)

# For third-party integrations (see logger.integration.md)
SENTRY_DSN=https://...
DD_API_KEY=...
NEW_RELIC_LICENSE_KEY=...
```

## Migration from Old Logger

The old `logger` middleware has been replaced with the new Pino-based system:

```typescript
// Old
import { logger } from '@atriz/core';
webService.app.use(logger);

// New
import { logger as httpLogger } from '@atriz/core';
webService.app.use(httpLogger);
```

The new system provides:

- ✅ Request ID tracking
- ✅ Structured JSON logs
- ✅ Better performance
- ✅ Easy third-party integration
- ✅ Automatic context in controllers and models

## API Reference

### Exported Functions

| Export                                            | Description                                   |
| ------------------------------------------------- | --------------------------------------------- |
| `logger`                                          | Default Pino logger instance                  |
| `log`                                             | Convenience methods (info, warn, error, etc.) |
| `createChildLogger(context)`                      | Create logger with additional context         |
| `logError(error, context?)`                       | Helper to log errors with stack traces        |
| `logPerformance(operation, durationMs, context?)` | Helper to log performance metrics             |
| `httpLogger`                                      | HTTP request logging middleware               |
| `requestIdMiddleware`                             | Middleware to add request IDs                 |

### Logger Methods

```typescript
logger.trace(obj, msg?)  // Most verbose
logger.debug(obj, msg?)  // Debugging
logger.info(obj, msg?)   // Information
logger.warn(obj, msg?)   // Warnings
logger.error(obj, msg?)  // Errors
logger.fatal(obj, msg?)  // Critical errors
```

## Performance

Pino is one of the fastest logging libraries:

- **5-10x faster** than Winston
- **Minimal overhead** on request handling
- **Async by default** - doesn't block event loop
- **Zero dependencies** in production

## Support

For questions or issues with the logging system, see:

- [`logger.examples.md`](./logger.examples.md) - Usage examples
- [`logger.integration.md`](./logger.integration.md) - Third-party integrations
- [Pino Documentation](https://getpino.io/) - Official Pino docs

---

**Happy Logging! 📝**
