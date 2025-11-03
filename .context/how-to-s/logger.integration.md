# Logger Integration Guide

This guide explains how to integrate third-party logging and error tracking services with the Pino-based logging system.

## Table of Contents

- [Sentry Integration](#sentry-integration)
- [Datadog Integration](#datadog-integration)
- [New Relic Integration](#new-relic-integration)
- [Custom Transport](#custom-transport)
- [Log Redaction (Sensitive Data)](#log-redaction-sensitive-data)

---

## Sentry Integration

Sentry provides error tracking and performance monitoring. Here's how to integrate it with Pino.

### 1. Install Dependencies

```bash
pnpm add @sentry/node pino-sentry
```

### 2. Update Logger Configuration

Create a custom logger configuration file (`logger.ts`):

```typescript
import pino from 'pino';
import { createWriteStream } from 'pino-sentry';

const isDevelopment = process.env.NODE_ENV !== 'production';

// Create Sentry stream (only in production)
const sentryStream = !isDevelopment
    ? createWriteStream({
          dsn: process.env.SENTRY_DSN,
          environment: process.env.NODE_ENV,
          // Only send errors and fatal logs to Sentry
          level: 'error',
          // Additional Sentry options
          serverName: process.env.SERVICE_NAME,
          stackAttributeKey: 'stack',
      })
    : null;

export const logger = pino(
    {
        level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
        ...(isDevelopment
            ? {
                  transport: {
                      target: 'pino-pretty',
                      options: {
                          colorize: true,
                          translateTime: 'HH:MM:ss',
                          ignore: 'pid,hostname',
                      },
                  },
              }
            : {}),
    },
    // Add Sentry stream in production
    sentryStream || undefined
);
```

### 3. Environment Variables

Add to your `.env` file:

```bash
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
SERVICE_NAME=atriz-backend
```

---

## Datadog Integration

Datadog provides application performance monitoring (APM) and log aggregation.

### 1. Install Dependencies

```bash
pnpm add dd-trace pino-datadog
```

### 2. Initialize Datadog Tracer

Create a `tracer.ts` file (import this at the very beginning of your app):

```typescript
import tracer from 'dd-trace';

tracer.init({
    logInjection: true, // Inject trace IDs into logs
    analytics: true,
    env: process.env.NODE_ENV,
    service: process.env.SERVICE_NAME || 'atriz-backend',
});

export default tracer;
```

### 3. Update Your Main Entry Point

In your `index.ts`:

```typescript
import './tracer'; // MUST be first import
import { logger } from '@atriz/core';
// ... rest of your imports
```

### 4. Configure Pino for Datadog

```typescript
import pino from 'pino';

export const logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    formatters: {
        log(object) {
            // Datadog expects these specific fields
            return {
                ...object,
                dd: {
                    trace_id: object.dd?.trace_id,
                    span_id: object.dd?.span_id,
                },
            };
        },
    },
});
```

### 5. Environment Variables

```bash
DD_API_KEY=your-datadog-api-key
DD_SITE=datadoghq.com  # or datadoghq.eu for EU
DD_SERVICE=atriz-backend
DD_ENV=production
DD_VERSION=1.0.0
```

### 6. Ship Logs to Datadog

**Option A: Use Datadog Agent (Recommended)**

- Install Datadog Agent on your server
- Configure it to tail your log files

**Option B: Direct HTTP Transport**

```bash
pnpm add pino-datadog
```

```typescript
import { createWriteStream } from 'pino-datadog';

const datadogStream = createWriteStream({
    apiKey: process.env.DD_API_KEY,
    ddsource: 'nodejs',
    service: process.env.DD_SERVICE,
    ddtags: `env:${process.env.DD_ENV}`,
});

export const logger = pino(datadogStream);
```

---

## New Relic Integration

New Relic provides full-stack observability.

### 1. Install Dependencies

```bash
pnpm add newrelic pino-newrelic
```

### 2. Create New Relic Configuration

Create `newrelic.js` in your project root:

```javascript
'use strict';

exports.config = {
    app_name: [process.env.NEW_RELIC_APP_NAME || 'Atriz Backend'],
    license_key: process.env.NEW_RELIC_LICENSE_KEY,
    logging: {
        level: 'info',
        enabled: true,
    },
    application_logging: {
        forwarding: {
            enabled: true,
            max_samples_stored: 10000,
        },
        metrics: {
            enabled: true,
        },
    },
    distributed_tracing: {
        enabled: true,
    },
};
```

### 3. Initialize New Relic

In your main entry point (`index.ts`):

```typescript
// MUST be the first import
if (process.env.NODE_ENV === 'production') {
    require('newrelic');
}

import { logger } from '@atriz/core';
// ... rest of your imports
```

### 4. Environment Variables

```bash
NEW_RELIC_LICENSE_KEY=your-license-key
NEW_RELIC_APP_NAME=atriz-backend
```

---

## Custom Transport

You can create custom transports to send logs to any service.

### Example: Slack Notifications for Critical Errors

```typescript
import pino from 'pino';
import { Transform } from 'stream';

// Custom Slack transport
class SlackTransport extends Transform {
    constructor(private webhookUrl: string) {
        super({ objectMode: true });
    }

    _transform(chunk: any, encoding: string, callback: Function) {
        const log = JSON.parse(chunk.toString());

        // Only send fatal errors to Slack
        if (log.level >= 60) {
            this.sendToSlack(log).catch(console.error);
        }

        callback();
    }

    private async sendToSlack(log: any) {
        const message = {
            text: '🚨 Critical Error Alert',
            blocks: [
                {
                    type: 'section',
                    text: {
                        type: 'mrkdwn',
                        text: `*Error:* ${log.msg}\n*Service:* ${log.service}\n*Time:* ${log.time}`,
                    },
                },
            ],
        };

        await fetch(this.webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(message),
        });
    }
}

// Usage
const streams = [
    { stream: process.stdout },
    { stream: new SlackTransport(process.env.SLACK_WEBHOOK_URL!) },
];

export const logger = pino({ level: 'info' }, pino.multistream(streams));
```

---

## Log Redaction (Sensitive Data)

Prevent sensitive information from appearing in logs.

### Option 1: Built-in Redaction

```typescript
import pino from 'pino';

export const logger = pino({
    redact: {
        paths: [
            'password',
            'passwordHash',
            'token',
            'accessToken',
            'refreshToken',
            'secret',
            'creditCard',
            'ssn',
            '*.password',
            '*.token',
            'req.headers.authorization',
            'req.headers.cookie',
        ],
        censor: '[REDACTED]',
    },
});
```

### Option 2: Custom Redaction Function

```typescript
import pino from 'pino';

function redactSensitiveData(key: string, value: any): any {
    const sensitivePatterns = [
        /password/i,
        /token/i,
        /secret/i,
        /apikey/i,
        /authorization/i,
    ];

    if (sensitivePatterns.some(pattern => pattern.test(key))) {
        return '[REDACTED]';
    }

    // Redact email addresses (keep domain)
    if (typeof value === 'string' && value.includes('@')) {
        return value.replace(/(.{2})[^@]*@/, '$1***@');
    }

    // Redact credit card numbers
    if (
        typeof value === 'string' &&
        /\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}/.test(value)
    ) {
        return value.replace(/\d(?=\d{4})/g, '*');
    }

    return value;
}

export const logger = pino({
    serializers: {
        req: req => {
            const serialized: any = {};
            for (const [key, value] of Object.entries(req)) {
                serialized[key] = redactSensitiveData(key, value);
            }
            return serialized;
        },
    },
});
```

### Option 3: Exclude Sensitive Fields Entirely

```typescript
import pino from 'pino';

export const logger = pino({
    redact: {
        paths: [
            'req.body.password',
            'req.body.oldPassword',
            'req.body.newPassword',
            'req.headers["authorization"]',
            'req.headers["cookie"]',
        ],
        remove: true, // Remove entirely instead of replacing
    },
});
```

---

## Best Practices

1. **Never log passwords or tokens** - Use redaction to prevent accidental leaks
2. **Use structured logging** - Always pass objects with context
3. **Set appropriate log levels** - Use DEBUG for development, INFO for production
4. **Use child loggers** - Add context for specific operations
5. **Monitor performance** - Logging can impact performance; use sampling for high-traffic endpoints
6. **Centralize logs** - Use a log aggregation service in production
7. **Set up alerts** - Configure alerts for ERROR and FATAL level logs

---

## Example Usage with Context

```typescript
// In a controller
export class UserController extends BaseController {
    protected async execute() {
        this.logger.info({ userId: this.userId }, 'Fetching user profile');

        try {
            const user = await this.userService.getUser(this.userId);
            this.logger.debug({ user }, 'User profile retrieved');
            return user;
        } catch (error) {
            this.logger.error(
                { error, userId: this.userId },
                'Failed to fetch user profile'
            );
            throw error;
        }
    }
}

// In a model
export class User extends BaseModel {
    async beforeCreate() {
        this.logger.info({ email: this.email }, 'Creating new user');
        // ... hash password, etc.
    }
}
```

---

## Environment Variables Summary

```bash
# Logging
NODE_ENV=production
LOG_LEVEL=info

# Sentry
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
SERVICE_NAME=atriz-backend

# Datadog
DD_API_KEY=your-datadog-api-key
DD_SITE=datadoghq.com
DD_SERVICE=atriz-backend
DD_ENV=production
DD_VERSION=1.0.0

# New Relic
NEW_RELIC_LICENSE_KEY=your-license-key
NEW_RELIC_APP_NAME=atriz-backend

# Custom
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

---

## Testing Your Integration

After setting up any integration, test it:

```typescript
import { logger } from '@atriz/core';

// Test different log levels
logger.info('Info message');
logger.warn('Warning message');
logger.error(new Error('Test error'), 'Error message');
logger.fatal('Fatal error - this should trigger alerts');
```

Check your third-party service dashboard to confirm logs are being received.
