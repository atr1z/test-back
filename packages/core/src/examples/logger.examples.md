# Logger Usage Examples

This document provides practical examples of using the enhanced Pino-based logging system in different parts of your application.

## Table of Contents

- [Basic Usage](#basic-usage)
- [Controller Logging](#controller-logging)
- [Model Logging](#model-logging)
- [Service Logging](#service-logging)
- [Repository Logging](#repository-logging)
- [Middleware Logging](#middleware-logging)
- [Error Logging](#error-logging)
- [Performance Logging](#performance-logging)
- [Best Practices](#best-practices)

---

## Basic Usage

### Using the Default Logger

```typescript
import { logger, log } from '@atriz/core';

// Simple info log
logger.info('Application started');

// Log with context object
logger.info(
    {
        userId: '123',
        action: 'login',
    },
    'User logged in successfully'
);

// Using convenience methods
log.info({ event: 'startup' }, 'Server is ready');
log.warn({ threshold: 90, current: 95 }, 'CPU usage is high');
log.error({ error: err }, 'Database connection failed');
```

### Creating Child Loggers

```typescript
import { createChildLogger } from '@atriz/core';

// Create a child logger with persistent context
const dbLogger = createChildLogger({ component: 'database' });

dbLogger.info('Executing query');
// Output includes: { component: 'database', msg: 'Executing query' }

const userLogger = createChildLogger({
    module: 'user-management',
    userId: '456',
});
userLogger.debug('Updating user profile');
// Output includes: { module: 'user-management', userId: '456', msg: 'Updating user profile' }
```

---

## Controller Logging

The `BaseController` automatically provides a logger instance with request context.

### Example: Simple Logging in Controller

```typescript
import { BaseController } from '@atriz/core';

export class GetUserController extends BaseController {
    protected defineParams() {
        return [{ name: 'userId', required: true, type: 'string' }];
    }

    protected async execute() {
        const userId = this.getParam<string>('userId');

        // Log the start of operation
        this.logger.info({ userId }, 'Fetching user profile');

        try {
            const user = await this.userService.getUser(userId);

            // Log successful operation with data
            this.logger.debug(
                {
                    userId,
                    userEmail: user.email,
                },
                'User profile retrieved'
            );

            return user;
        } catch (error) {
            // Error logging is automatic in handleError,
            // but you can add custom context
            this.logger.error(
                {
                    userId,
                    error: error instanceof Error ? error.message : error,
                },
                'Failed to retrieve user profile'
            );

            throw error;
        }
    }
}
```

### Example: Logging with Performance Metrics

```typescript
export class CreateOrderController extends BaseController {
    protected async execute() {
        const startTime = Date.now();

        this.logger.info({ userId: this.userId }, 'Creating new order');

        const order = await this.orderService.createOrder({
            userId: this.userId,
            items: this.getParam('items'),
        });

        const duration = Date.now() - startTime;

        this.logger.info(
            {
                orderId: order.id,
                userId: this.userId,
                itemCount: this.getParam('items').length,
                durationMs: duration,
            },
            `Order created in ${duration}ms`
        );

        return order;
    }
}
```

### Example: Conditional Logging

```typescript
export class SearchController extends BaseController {
    protected async execute() {
        const query = this.getParam<string>('query');
        const filters = this.getParam('filters');

        // Log debug info only when needed
        if (process.env.LOG_LEVEL === 'debug') {
            this.logger.debug(
                {
                    query,
                    filters,
                    userId: this.userId,
                },
                'Search parameters'
            );
        }

        const results = await this.searchService.search(query, filters);

        // Log important metrics
        this.logger.info(
            {
                query,
                resultCount: results.length,
                userId: this.userId,
            },
            'Search completed'
        );

        return results;
    }
}
```

---

## Model Logging

The `BaseModel` automatically provides a logger instance with model context.

### Example: Logging in Lifecycle Hooks

```typescript
import { BaseModel } from '@atriz/core';

export class User extends BaseModel {
    id?: string;
    email: string;
    name: string;
    passwordHash: string;

    protected async beforeCreate() {
        this.logger.info(
            {
                email: this.email,
                name: this.name,
            },
            'Preparing to create user'
        );

        // Hash password
        this.passwordHash = await hashPassword(this.passwordHash);

        this.logger.debug('Password hashed successfully');
    }

    protected async afterCreate() {
        this.logger.info(
            {
                userId: this.id,
                email: this.email,
            },
            'User created successfully'
        );

        // Send welcome email (don't await)
        this.sendWelcomeEmail().catch(err => {
            this.logger.error(
                {
                    error: err,
                    userId: this.id,
                },
                'Failed to send welcome email'
            );
        });
    }

    protected async beforeUpdate() {
        this.logger.debug(
            {
                userId: this.id,
            },
            'Updating user'
        );
    }

    protected async beforeDelete() {
        this.logger.warn(
            {
                userId: this.id,
                email: this.email,
            },
            'Deleting user - this action cannot be undone'
        );
    }

    private async sendWelcomeEmail() {
        this.logger.info({ userId: this.id }, 'Sending welcome email');
        // Email sending logic...
    }
}
```

### Example: Logging Validation Errors

```typescript
export class Product extends BaseModel {
    protected async validate() {
        const errors: string[] = [];

        if (!this.name) {
            errors.push('Product name is required');
        }

        if (this.price < 0) {
            errors.push('Price cannot be negative');
        }

        if (errors.length > 0) {
            this.logger.warn(
                {
                    errors,
                    productData: {
                        name: this.name,
                        price: this.price,
                    },
                },
                'Product validation failed'
            );

            throw new Error(errors.join('; '));
        }

        this.logger.debug('Product validation passed');
    }
}
```

---

## Service Logging

Create child loggers for services to maintain context across operations.

### Example: Service with Logger

```typescript
import { createChildLogger, Logger } from '@atriz/core';

export class PaymentService {
    private logger: Logger;

    constructor() {
        this.logger = createChildLogger({ service: 'PaymentService' });
    }

    async processPayment(orderId: string, amount: number, userId: string) {
        this.logger.info(
            {
                orderId,
                amount,
                userId,
            },
            'Processing payment'
        );

        try {
            // Call payment gateway
            const result = await this.paymentGateway.charge({
                orderId,
                amount,
            });

            this.logger.info(
                {
                    orderId,
                    transactionId: result.transactionId,
                    amount,
                    status: result.status,
                },
                'Payment processed successfully'
            );

            return result;
        } catch (error) {
            this.logger.error(
                {
                    orderId,
                    amount,
                    error:
                        error instanceof Error
                            ? {
                                  message: error.message,
                                  stack: error.stack,
                              }
                            : error,
                },
                'Payment processing failed'
            );

            throw error;
        }
    }

    async refundPayment(transactionId: string) {
        this.logger.warn(
            {
                transactionId,
            },
            'Initiating refund'
        );

        const result = await this.paymentGateway.refund(transactionId);

        this.logger.info(
            {
                transactionId,
                refundId: result.refundId,
            },
            'Refund completed'
        );

        return result;
    }
}
```

---

## Repository Logging

Log database operations for debugging and monitoring.

### Example: Repository with Query Logging

```typescript
import { BaseRepository, createChildLogger, Logger } from '@atriz/core';

export class UserRepository extends BaseRepository<User> {
    private logger: Logger;

    constructor(pool: Pool) {
        super(pool);
        this.logger = createChildLogger({ repository: 'UserRepository' });
    }

    async findByEmail(email: string): Promise<User | null> {
        const startTime = Date.now();

        this.logger.debug({ email }, 'Finding user by email');

        const query = 'SELECT * FROM users WHERE email = $1';
        const result = await this.pool.query(query, [email]);

        const duration = Date.now() - startTime;

        if (result.rows.length === 0) {
            this.logger.debug(
                {
                    email,
                    durationMs: duration,
                },
                'User not found'
            );
            return null;
        }

        this.logger.debug(
            {
                email,
                userId: result.rows[0].id,
                durationMs: duration,
            },
            `User found in ${duration}ms`
        );

        return this.mapToModel(result.rows[0]);
    }

    async updateLastLogin(userId: string): Promise<void> {
        this.logger.info({ userId }, 'Updating last login timestamp');

        const query = `
            UPDATE users 
            SET last_login_at = NOW() 
            WHERE id = $1
        `;

        await this.pool.query(query, [userId]);

        this.logger.debug({ userId }, 'Last login updated');
    }
}
```

---

## Middleware Logging

The HTTP logger middleware automatically logs all requests, but you can add custom logging.

### Example: Custom Middleware with Logging

```typescript
import { Request, Response, NextFunction } from 'express';
import { createChildLogger } from '@atriz/core';

const logger = createChildLogger({ middleware: 'RateLimiter' });

export function rateLimiter(req: Request, res: Response, next: NextFunction) {
    const ip = req.ip;
    const currentRequests = getRateLimit(ip);

    logger.debug(
        {
            ip,
            currentRequests,
            path: req.path,
        },
        'Checking rate limit'
    );

    if (currentRequests > 100) {
        logger.warn(
            {
                ip,
                currentRequests,
                path: req.path,
            },
            'Rate limit exceeded'
        );

        return res.status(429).json({
            success: false,
            message: 'Too many requests',
        });
    }

    incrementRateLimit(ip);
    next();
}
```

---

## Error Logging

### Example: Comprehensive Error Logging

```typescript
import { logError } from '@atriz/core';

try {
    await riskyOperation();
} catch (error) {
    // Use the helper function for consistent error logging
    logError(error, {
        operation: 'riskyOperation',
        userId: '123',
        additionalContext: 'some important info',
    });

    throw error;
}
```

### Example: Custom Error Handler

```typescript
import { logger } from '@atriz/core';
import { Request, Response, NextFunction } from 'express';

export function errorHandler(
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
) {
    // Log the error with full context
    logger.error(
        {
            error: {
                message: err.message,
                stack: err.stack,
                name: err.name,
            },
            request: {
                method: req.method,
                path: req.path,
                query: req.query,
                userId: (req as any).user?.userId,
            },
        },
        'Unhandled error occurred'
    );

    res.status(500).json({
        success: false,
        message: 'Internal server error',
    });
}
```

---

## Performance Logging

### Example: Track Operation Duration

```typescript
import { logPerformance } from '@atriz/core';

async function complexOperation() {
    const startTime = Date.now();

    // ... do complex work ...

    const duration = Date.now() - startTime;

    logPerformance('complexOperation', duration, {
        itemsProcessed: 1000,
        cacheHits: 850,
    });
}
```

### Example: Database Query Performance

```typescript
export class AnalyticsService {
    private logger = createChildLogger({ service: 'AnalyticsService' });

    async generateReport(filters: any) {
        const queryStartTime = Date.now();

        const data = await this.repository.fetchData(filters);

        const queryDuration = Date.now() - queryStartTime;

        this.logger.info(
            {
                operation: 'generateReport',
                queryDurationMs: queryDuration,
                rowCount: data.length,
                filters,
            },
            `Report generated with ${data.length} rows in ${queryDuration}ms`
        );

        // Warn if query is slow
        if (queryDuration > 1000) {
            this.logger.warn(
                {
                    queryDurationMs: queryDuration,
                    filters,
                },
                'Slow query detected'
            );
        }

        return data;
    }
}
```

---

## Best Practices

### 1. Always Include Context

```typescript
// Bad
this.logger.info('User updated');

// Good
this.logger.info(
    {
        userId: this.userId,
        updatedFields: ['email', 'name'],
    },
    'User updated'
);
```

### 2. Use Appropriate Log Levels

```typescript
// trace: Very detailed debugging (usually disabled)
this.logger.trace({ variable: value }, 'Variable state');

// debug: Detailed debugging information
this.logger.debug({ query: sql }, 'Executing database query');

// info: General informational messages
this.logger.info({ userId }, 'User logged in');

// warn: Warning messages (potential issues)
this.logger.warn({ attempts: 3 }, 'Multiple failed login attempts');

// error: Error messages (handled errors)
this.logger.error({ error }, 'Failed to process payment');

// fatal: Critical errors (app should probably exit)
this.logger.fatal({ error }, 'Database connection lost');
```

### 3. Don't Log Sensitive Data

```typescript
// Bad
this.logger.info(
    {
        password: user.password,
        creditCard: order.creditCard,
    },
    'Processing order'
);

// Good
this.logger.info(
    {
        userId: user.id,
        orderAmount: order.amount,
    },
    'Processing order'
);
```

### 4. Structure Your Logs

```typescript
// Use consistent field names across your app
this.logger.info(
    {
        operation: 'create_user', // What happened
        userId: user.id, // Who/What
        durationMs: duration, // How long
        success: true, // Result
    },
    'User created successfully'
);
```

### 5. Use Child Loggers for Context

```typescript
// Create child loggers to maintain context across operations
class OrderProcessor {
    async processOrder(orderId: string) {
        // Create a child logger with the order context
        const orderLogger = createChildLogger({
            orderId,
            processor: 'OrderProcessor',
        });

        orderLogger.info('Starting order processing');

        // All logs now include orderId and processor
        await this.validateOrder(orderLogger);
        await this.chargePayment(orderLogger);
        await this.shipOrder(orderLogger);

        orderLogger.info('Order processing completed');
    }
}
```

---

## Log Output Examples

### Development (Pretty Format)

```
[12:34:56] INFO: User logged in
    userId: "123"
    email: "user@example.com"

[12:34:57] WARN: High memory usage detected
    memoryUsage: 85
    threshold: 80

[12:34:58] ERROR: Payment processing failed
    orderId: "ord_123"
    error: {
      message: "Insufficient funds"
      stack: "Error: Insufficient funds\n    at PaymentService.charge..."
    }
```

### Production (JSON Format)

```json
{"level":"info","time":"2024-11-03T12:34:56.789Z","userId":"123","email":"user@example.com","msg":"User logged in"}
{"level":"warn","time":"2024-11-03T12:34:57.123Z","memoryUsage":85,"threshold":80,"msg":"High memory usage detected"}
{"level":"error","time":"2024-11-03T12:34:58.456Z","orderId":"ord_123","error":{"message":"Insufficient funds","stack":"Error..."},"msg":"Payment processing failed"}
```

---

This logging system provides powerful debugging capabilities during development and structured, queryable logs in production. Use it consistently across your application for better observability and easier troubleshooting!
