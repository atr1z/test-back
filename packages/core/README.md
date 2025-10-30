# @atriz/core

Core shared framework and utilities for Atriz backend applications.

## Overview

This package provides the foundational building blocks for all Atriz backend services, ensuring consistency, maintainability, and rapid development across multiple projects.

## Features

- **Database Management**: PostgreSQL connection pooling and query utilities
- **Authentication**: JWT-based authentication middleware and utilities
- **File Storage**: Abstracted storage layer supporting MinIO and S3-compatible services
- **Caching**: Redis integration for session management and caching
- **Real-time**: Socket.io configuration and utilities
- **Logging**: Structured logging with multiple output formats
- **Error Handling**: Centralized error handling and response formatting
- **Types**: Shared TypeScript types and interfaces

## Installation

```bash
# Install as a dependency in your app
pnpm add @atriz/core
```

## Usage

```typescript
import {} from /* features will be exported here */ '@atriz/core';
```

## Development

```bash
# Build the package
pnpm build

# Watch mode for development
pnpm dev

# Type checking
pnpm type-check

# Clean build artifacts
pnpm clean
```

## License

Private - All rights reserved
