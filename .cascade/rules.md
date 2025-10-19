# Mextrack Backends - Project Rules

## Project Overview
- **Project Name**: mextrack-backends
- **Type**: Turborepo Monorepo
- **Purpose**: Multi-service backend for Mextrack (fleet tracking) and PShop (point of sale)
- **Tech Stack**: Node.js, Express, TypeScript, PostgreSQL, Lucia Auth
- **Package Manager**: pnpm with Turborepo
- **Testing**: Vitest
- **Deployment**: Dokploy

## Architecture

### Monorepo Structure
```
mextrack-backends/
├── apps/                    # Application services
│   ├── mextrack/           # Fleet tracking API (port 3001)
│   └── pshop/              # Point of sale API (port 3002)
├── packages/               # Shared packages
│   ├── auth/              # Lucia Auth implementation
│   ├── database/          # PostgreSQL client + migrations
│   ├── types/             # TypeScript type definitions
│   └── utils/             # Shared utilities
```

### Database Architecture
- **Shared users table**: All services use the same authentication
- **Service-specific tables**: Each service has its own domain tables
- **Migrations**: Sequential SQL files in `packages/database/src/migrations/`
- **Seeds**: Environment-specific data in `packages/database/src/seeds/{env}/`

## Key Design Decisions

1. **Turborepo over pnpm workspaces alone**: Better caching and build orchestration
2. **Lucia Auth**: Modern, secure session-based authentication
3. **Custom migrations**: Full SQL control without ORM overhead
4. **postgres package**: Lightweight PostgreSQL client
5. **Zod**: Runtime type validation
6. **Winston**: Structured logging
7. **Vitest**: Fast, modern testing framework

## Development Guidelines

### Package Management
- Always use `pnpm` for package installation
- Workspace packages use `workspace:*` protocol
- Run commands from root using Turbo: `pnpm dev`, `pnpm build`, `pnpm test`

### Code Structure
- **Controllers**: Handle HTTP requests/responses
- **Services**: Business logic layer
- **Models**: Database queries (if needed)
- **Middleware**: Request processing (auth, validation, errors)
- **Routes**: API endpoint definitions

### Database Operations
```bash
pnpm db:migrate        # Run migrations
pnpm db:seed          # Seed development data
pnpm db:reset         # Reset database (dev only)
pnpm db:rollback      # Remove last migration record
```

### Testing Strategy
- Unit tests for services and utilities
- Integration tests for API routes
- Use test database for integration tests
- Minimum 80% coverage for critical paths

### Error Handling
- Use custom error classes from `@mextrack/utils`
- Always catch and log errors
- Return structured API responses
- Never expose sensitive error details in production

## Environment Variables

### Required for All Services
- `DATABASE_URL`: PostgreSQL connection string
- `NODE_ENV`: development | test | production
- `PORT`: Service port number
- `CORS_ORIGIN`: Allowed origin for CORS
- `LOG_LEVEL`: debug | info | warn | error

### Auth-specific
- `JWT_SECRET`: JWT signing secret (not used with Lucia but kept for compatibility)
- `SESSION_SECRET`: Session cookie secret

## API Conventions

### Request/Response Format
```typescript
// Success Response
{
  "success": true,
  "data": {},
  "message": "Optional message"
}

// Error Response
{
  "success": false,
  "error": "Error message",
  "details": {} // Optional validation details
}
```

### HTTP Status Codes
- 200: Success
- 201: Created
- 204: No Content
- 400: Bad Request / Validation Error
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 409: Conflict
- 500: Internal Server Error

### Authentication
- Session-based using Lucia Auth
- Session cookie: `auth_session`
- Protected routes use `authMiddleware`
- Optional auth uses `optionalAuthMiddleware`

## Migration Guidelines

### Creating Migrations
```bash
pnpm db:migrate:create
# Enter migration name when prompted
# Edit the generated SQL file
# Run: pnpm db:migrate
```

### Migration Rules
- Never modify existing migrations after they run
- Always use transactions for multiple operations
- Add indexes for foreign keys and query columns
- Include rollback instructions in comments
- Test migrations on a copy of production data

### Migration File Format
```sql
-- Migration: Description
-- Created at: ISO timestamp

-- Forward migration SQL
CREATE TABLE ...

-- Rollback (for documentation):
-- DROP TABLE ...
```

## Shared Package Usage

### @mextrack/auth
```typescript
import { lucia, hashPassword, verifyPassword, authMiddleware } from '@mextrack/auth';
```

### @mextrack/database
```typescript
import { sql } from '@mextrack/database';

// Query example
const users = await sql`SELECT * FROM users WHERE id = ${userId}`;
```

### @mextrack/types
```typescript
import type { User, ApiResponse, PaginatedResponse } from '@mextrack/types';
```

### @mextrack/utils
```typescript
import { logger, successResponse, errorResponse, ValidationError } from '@mextrack/utils';
```

## Deployment

### Build Process
```bash
# Install dependencies
pnpm install

# Build all packages and apps
pnpm build

# Or build specific service
pnpm build:mextrack
pnpm build:pshop
```

### Dokploy Configuration
**Build Command**: `pnpm install && pnpm build:{service}`
**Start Command**: `node dist/index.js`
**Working Directory**: `apps/{service}`

### Environment Setup
1. Set all required environment variables
2. Run migrations: `pnpm db:migrate`
3. Seed production data: `pnpm db:seed:prod`
4. Start services

## Security Best Practices

1. **Never commit .env files** (except .env.example)
2. **Use environment variables** for all secrets
3. **Hash passwords** with Argon2id (via @node-rs/argon2)
4. **Validate all input** with Zod schemas
5. **Sanitize output** to prevent XSS
6. **Use secure session cookies** in production
7. **Rate limit** authentication endpoints (TODO)
8. **Use HTTPS** in production
9. **Keep dependencies updated** regularly
10. **Review database queries** for SQL injection risks

## Common Issues & Solutions

### Issue: Package not found
**Solution**: Run `pnpm install` from root

### Issue: Database connection fails
**Solution**: Check DATABASE_URL environment variable

### Issue: Turbo cache issues
**Solution**: Run `pnpm clean:cache`

### Issue: TypeScript errors in workspace packages
**Solution**: Run `pnpm type-check` to see all errors

### Issue: Migrations don't run
**Solution**: Check if migrations table exists, verify file order

## Git Workflow

### Branch Strategy
- `main`: Production-ready code
- `develop`: Development branch
- `feature/*`: Feature branches
- `fix/*`: Bug fix branches

### Commit Convention
```
type(scope): description

Types: feat, fix, docs, style, refactor, test, chore
Scope: service or package name
Example: feat(mextrack): add vehicle tracking endpoint
```

### Pull Request Process
1. Create feature branch from `develop`
2. Implement changes with tests
3. Run linting: `pnpm lint`
4. Run tests: `pnpm test`
5. Create PR to `develop`
6. Request review
7. Merge after approval

## CI/CD

### GitHub Actions Workflows
- **test.yml**: Run tests on push/PR
- **lint.yml**: Run linting and type checking

### Pre-deployment Checklist
- [ ] All tests pass
- [ ] No linting errors
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Build succeeds
- [ ] Health endpoint responds

## Future Enhancements

### Planned Features
- [ ] Complete PShop service implementation
- [ ] API documentation (OpenAPI/Swagger)
- [ ] Rate limiting middleware
- [ ] Email verification system
- [ ] WebSocket support for real-time tracking
- [ ] Automated backups
- [ ] Performance monitoring
- [ ] End-to-end tests

### Technical Debt
- [ ] Add comprehensive integration tests
- [ ] Implement request logging middleware
- [ ] Add API versioning
- [ ] Database connection pooling optimization
- [ ] Implement caching layer (Redis)

## Contact & Support

For questions or issues:
1. Check this document first
2. Review relevant package README
3. Check GitHub issues
4. Contact team lead

---

**Last Updated**: 2024-01-19
**Maintainers**: Atriz Development Team
