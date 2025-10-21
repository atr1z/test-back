# Atriz Framework - Project Rules

## Project Overview
- **Project Name**: atriz-backend
- **Type**: Framework + Turborepo Monorepo
- **Purpose**: **Framework-first approach** for building scalable, maintainable backend services
- **Tech Stack**: Node.js, Express, TypeScript, TSyringe (DI), JWT Auth, bcrypt
- **Package Manager**: pnpm with Turborepo
- **Testing**: Vitest
- **Philosophy**: Build the framework first, then build applications with it

## Architecture

### Monorepo Structure
```
atriz-backend/
├── packages/               # Framework packages (THE CORE)
│   ├── core/              # Main framework (BaseController, DI, Validators, etc.)
│   └── auth/              # Authentication module (JWT, Password, Middleware)
├── apps/                  # Applications built with the framework
│   ├── atriz/            # Example/demo app
│   ├── mextrack/         # Fleet tracking API (future)
│   └── pshop/            # Point of sale API (future)
```

### Framework Architecture (@atriz/core)
The core framework provides:
- **Dependency Injection**: TSyringe-based container for loose coupling
- **BaseController**: Abstract controller class with built-in validation and response helpers
- **Parameter Validation**: Type-safe validation system (email, password, phone, UUID, etc.)
- **Middleware**: Async handler, logger, error handling
- **WebService**: Express application wrapper with security defaults (Helmet, CORS, Compression)
- **Testing Utilities**: Mock request/response, controller test helpers
- **Type System**: Shared types for controllers, validation, responses

### Authentication Architecture (@atriz/auth)
- **JWT-based authentication**: Token generation and verification
- **Password hashing**: bcrypt for secure password storage
- **Auth Middleware Factory**: Creates middleware from services
- **DI Integration**: All services are injectable

## Key Design Decisions

1. **Framework-First**: Build reusable abstractions before application code
2. **Dependency Injection**: TSyringe for testability and modularity
3. **BaseController Pattern**: Inspired by endpoint pattern, but more flexible
4. **Built-in Validation**: No external validation libraries needed (custom ParamValidator)
5. **Type Safety**: Full TypeScript support with strict mode
6. **Convention over Configuration**: Sensible defaults, easy to override
7. **Testing-Friendly**: Built-in mocks and test helpers
8. **Security by Default**: Helmet, CORS, compression, SQL injection prevention

## Development Guidelines

### Package Management
- Always use `pnpm` for package installation
- Workspace packages use `workspace:*` protocol
- Run commands from root using scripts: `pnpm dev`, `pnpm build`, `pnpm test`
- Use app-specific scripts to run individual apps: `pnpm dev:mextrack`, `pnpm dev:pshop`

### Framework Development Workflow
1. **Build framework packages first** (`@atriz/core`, `@atriz/auth`)
2. **Write tests for framework code** (high coverage required)
3. **Build applications** using framework abstractions
4. **Refactor common patterns** back into framework packages

### Code Structure (Framework)
```
packages/core/
├── src/
│   ├── app.ts                 # AtrizApp class
│   ├── controller/            # BaseController
│   ├── di/                    # Dependency injection
│   ├── middleware/            # Express middleware
│   ├── validators/            # Parameter validation
│   ├── testing/               # Test utilities
│   ├── types/                 # TypeScript types
│   └── utils/                 # Utility functions
```

### Code Structure (Applications)
- **Controllers**: Extend `BaseController`, define params and execute logic
- **Services**: Business logic, injected via DI container
- **Routes**: Wire controllers with Express routes, resolve services from DI
- **DI Container**: Register services at startup

### Controller Pattern
Every controller follows this structure:
```typescript
export class MyController extends BaseController<Services> {
    constructor(req, res, services) {
        super(req, res, services);
        this.requiresAuth = true; // or false
    }
    
    protected defineParams(): ParamDefinition[] {
        return [/* validation rules */];
    }
    
    protected async execute(): Promise<any> {
        // Business logic here
        return data;
    }
}
```

### Testing Strategy
- **Framework packages**: Unit tests with 90%+ coverage
- **Application code**: Integration tests for endpoints
- **Use test helpers**: `mockRequest`, `mockResponse`, `controllerTestHelper`
- **Mock services**: Use DI container to inject mocks

### Error Handling
- Controllers automatically handle errors via `BaseController.handleError()`
- Use built-in response helpers: `success()`, `error()`, `notFound()`, `unauthorized()`, etc.
- Validation errors handled automatically by `ParamValidator`
- Never expose sensitive details in production (controlled by `AtrizApp.config.env`)

## Environment Variables

### Required for All Applications
- `NODE_ENV`: development | test | production
- `PORT`: Service port number
- `CORS_ORIGIN`: Allowed origin(s) for CORS
- `LOG_LEVEL`: debug | info | warn | error (optional)

### Auth-specific (@atriz/auth)
- `JWT_SECRET`: Secret key for JWT signing (required)
- `JWT_EXPIRES_IN`: Token expiration time (default: '24h')

### Optional (App-specific)
- `DATABASE_URL`: If using a database
- `REDIS_URL`: If using Redis for caching
- Any other service-specific variables

## API Conventions

### Request/Response Format
All responses follow this structure (handled by `BaseController`):

```typescript
// Success Response
{
  "success": true,
  "data": any,
  "message": "Optional message",
  "meta": {
    "timestamp": "2025-10-19T...",
    "path": "/api/resource"
  }
}

// Error Response
{
  "success": false,
  "message": "Error message",
  "errors": ["Validation error 1", "Validation error 2"],
  "meta": {
    "timestamp": "2025-10-19T...",
    "path": "/api/resource"
  }
}
```

### HTTP Status Codes (HttpStatus enum)
- `200` OK: Success
- `201` Created: Resource created
- `204` NoContent: Success, no body
- `400` BadRequest: Client error
- `401` Unauthorized: Authentication required
- `403` Forbidden: No permission
- `404` NotFound: Resource not found
- `409` Conflict: Resource already exists
- `422` UnprocessableEntity: Validation failed
- `500` InternalServerError: Server error

### Authentication
- **JWT-based** using `@atriz/auth`
- Authorization header: `Authorization: Bearer <token>`
- Protected routes use auth middleware from `createAuthMiddleware(jwtService)`
- Controllers set `this.requiresAuth = true` to enforce authentication
- User info available in controller as `this.userId`, `this.userEmail`, `this.user`

## Framework Package Usage

### @atriz/core

```typescript
import {
    BaseController,
    ParamDefinition,
    ControllerRequest,
    HttpStatus,
    WebService,
    loadEnv,
    getEnv,
    getEnvAsNumber,
    registerSingleton,
    resolve,
} from '@atriz/core';

// Load environment and create a web service
loadEnv();

const webService = new WebService({
    port: getEnvAsNumber('PORT', 3000),
    env: getEnv('NODE_ENV', 'development'),
    cors: { origin: 'http://localhost:5173', credentials: true }
});

// Define a controller
export class MyController extends BaseController {
    protected defineParams(): ParamDefinition[] {
        return [
            { name: 'email', type: 'email', required: true },
            { name: 'age', type: 'number', min: 18, max: 100 },
        ];
    }
    
    protected async execute() {
        const email = this.getParam<string>('email');
        return { email };
    }
}
```

### @atriz/auth

```typescript
import {
    JWTService,
    PasswordService,
    createAuthMiddleware,
    AUTH_TOKENS
} from '@atriz/auth';

// Initialize services
const jwtService = new JWTService(process.env.JWT_SECRET!);
const passwordService = new PasswordService();

// Register in DI container
registerSingleton(AUTH_TOKENS.JWTService, JWTService);
registerSingleton(AUTH_TOKENS.PasswordService, PasswordService);

// Use in routes
const authMiddleware = createAuthMiddleware(jwtService);
router.get('/protected', authMiddleware, handler);
```

### Validation Types

Available param types:
- `'string'` - Any string
- `'number'` - Numeric value
- `'boolean'` - Boolean value
- `'email'` - Valid email format
- `'password'` - Strong password (8+ chars, uppercase, lowercase, number, special)
- `'phone'` - Phone number format
- `'date'` - Valid date
- `'url'` - Valid URL
- `'uuid'` - Valid UUID
- `'object'` - Object type
- `'array'` - Array type
- `'file'` - File upload

## Deployment

### Build Process
```bash
# Install dependencies
pnpm install

# Build all packages and apps (Turbo handles dependency order)
pnpm build

# Build specific app
pnpm build:atriz       # or build:mextrack, build:pshop
```

### Deployment Steps
1. Build framework packages first (Turbo handles this automatically)
2. Build application
3. Set environment variables
4. Start application: `node dist/index.js`

### Environment Setup
1. Set all required environment variables (see Environment Variables section)
2. Ensure `NODE_ENV=production`
3. Set `JWT_SECRET` to a strong random value
4. Configure CORS_ORIGIN to your frontend domain
5. Start the service

## Security Best Practices

1. **Never commit .env files** (except .env.example)
2. **Use environment variables** for all secrets
3. **Hash passwords** with bcrypt (via `@atriz/auth` PasswordService)
4. **Validate all input** via `ParamValidator` (built-in SQL injection prevention)
5. **Use Helmet** for security headers (enabled by default in `WebService`)
6. **JWT tokens** should be stored securely (HttpOnly cookies preferred)
7. **Rate limit** authentication endpoints (implement in applications)
8. **Use HTTPS** in production
9. **Keep dependencies updated** regularly
10. **Strong JWT secrets** (use long random strings, rotate regularly)
11. **Enable CORS** only for trusted domains
12. **Input validation** is automatic via `defineParams()` in controllers

## Common Issues & Solutions

### Issue: Package not found (@atriz/core or @atriz/auth)
**Solution**: 
```bash
pnpm install        # From root
pnpm build          # Build framework packages
```

### Issue: TypeScript errors in workspace packages
**Solution**: 
```bash
pnpm type-check     # See all errors
pnpm build          # Rebuild packages
```

### Issue: Turbo cache issues
**Solution**: 
```bash
pnpm clean          # Clean all dist folders
turbo daemon clean  # Clear Turbo cache
```

### Issue: DI container errors
**Solution**: Ensure services are registered before resolving:
```typescript
// Register first
registerSingleton(AUTH_TOKENS.JWTService, JWTService);
// Then resolve
const jwt = resolve<JWTService>(AUTH_TOKENS.JWTService);
```

### Issue: Controller validation not working
**Solution**: Check `defineParams()` returns correct ParamDefinition array

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

## Versioning

### Version Management

Package versions are manually managed in `package.json` files. Framework packages follow semantic versioning.

### Semantic Versioning Rules

Follow [Semantic Versioning](https://semver.org/):

**Major (Breaking Changes)**:
- API signature changes
- Removing public methods/properties
- Changing behavior that breaks existing code
- Example: `1.2.3 → 2.0.0`

**Minor (New Features)**:
- Adding new features
- Adding new public methods
- Deprecating (not removing) features
- Example: `1.2.3 → 1.3.0`

**Patch (Bug Fixes)**:
- Bug fixes
- Performance improvements
- Documentation updates
- Internal refactoring
- Example: `1.2.3 → 1.2.4`

### What to Version

**Framework Packages** (use semantic versioning):
- `@atriz/core` - Core framework
- `@atriz/auth` - Authentication module
- `@atriz/storage` - File storage module
- `@atriz/database` - Database utilities

**Applications** (version as needed):
- `@atriz/website` - Example app
- `@atriz/mextrack-api` - Mextrack API
- `@atriz/pshop-api` - PShop API

### Best Practices

1. **Update CHANGELOG.md** for framework packages when releasing
2. **Document breaking changes** clearly
3. **Keep versions in sync** for interdependent packages

## CI/CD

### GitHub Actions Workflows

We use a **smart monorepo CI/CD strategy** that leverages Turbo:

- **`framework-quality.yml`**: Deep framework testing (90%+ coverage required)
- **`app-atriz.yml`**: Atriz example app CI
- **`app-mextrack.yml`**: Mextrack-specific CI/CD
- **`app-pshop.yml`**: PShop-specific CI/CD

**Key Features:**
- ✅ Only runs affected packages (Turbo smart filtering)
- ✅ Caching for faster builds
- ✅ Matrix testing (Node 18.x and 20.x)
- ✅ Coverage tracking
- ✅ Dependency security review

### Pre-deployment Checklist
- [ ] All CI checks pass
- [ ] No linting errors
- [ ] Type checking passes
- [ ] All tests pass with required coverage
- [ ] No security vulnerabilities
- [ ] Code reviewed and approved
- [ ] Environment variables configured
- [ ] Build succeeds
- [ ] Health endpoint responds

## Future Enhancements

### Framework Roadmap (@atriz/core)
- [ ] Storage package (`@atriz/storage` with S3/Minio support) - **NEXT PRIORITY**
- [ ] Caching package (`@atriz/cache` with Redis support)
- [ ] Rate limiting middleware
- [ ] File upload middleware (Multer integration)
- [ ] API documentation generator (OpenAPI/Swagger)
- [ ] WebSocket support package
- [ ] Queue system package (Bull/BullMQ integration)
- [ ] Email service package
- [ ] Logging package (Winston/Pino integration)
- [ ] Metrics and monitoring package

### Database Package (@atriz/database)
- [x] Connection management utilities (PostgreSQL)
- [x] Query execution helpers
- [ ] Migration support improvements
- [ ] Multi-database support (MySQL, SQLite)
- [ ] Connection pooling optimization

### Framework Features
- [ ] Role-based access control (RBAC) in controllers
- [ ] Pagination helpers
- [ ] Query builder integration
- [ ] GraphQL support
- [ ] Server-sent events (SSE)
- [ ] Multi-tenant support
- [ ] API versioning utilities
- [ ] Request/Response transformers
- [ ] Custom validation rules registry

### Application Examples
- [ ] Complete example apps showcasing all features
- [ ] E-commerce demo
- [ ] Real-time chat demo
- [ ] File management demo
- [ ] Admin dashboard demo

## Contact & Support

For questions or issues:
1. Check this document first
2. Review relevant package README
3. Check GitHub issues
4. Contact team lead

---

**Last Updated**: 2025-10-19
**Project Type**: Framework Development
**Maintainers**: Atriz Development Team
**Philosophy**: Framework First, Applications Second
