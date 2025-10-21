# Atriz Framework - Project Context

## Quick Reference

### Start Development
```bash
# Install dependencies
pnpm install

# Build framework packages
pnpm build

# Start development
pnpm dev
```

### Common Commands
```bash
# Development
pnpm dev                    # Start all apps in watch mode
pnpm dev:atriz              # Start Atriz example app only (port 3000)
pnpm dev:mextrack           # Start Mextrack API only (port 3001)
pnpm dev:pshop              # Start PShop API only (port 3002)

# Building
pnpm build                  # Build all packages and apps
pnpm build:atriz            # Build Atriz app only
pnpm build:mextrack         # Build Mextrack only
pnpm build:pshop            # Build PShop only

# Testing
pnpm test                   # Run all tests
pnpm test:atriz             # Test Atriz only
pnpm test:mextrack          # Test Mextrack only
pnpm test:pshop             # Test PShop only
pnpm test:watch             # Watch mode
pnpm test:coverage          # With coverage

# Code Quality
pnpm lint                   # Lint all
pnpm lint:fix               # Fix linting issues
pnpm format                 # Format code
pnpm format:check           # Check formatting
pnpm type-check             # TypeScript check

# Maintenance
pnpm clean                  # Clean all dist folders
pnpm clean:cache            # Clear Turbo cache
```

## Framework Packages

### @atriz/core (The Main Framework)
- **BaseController**: Abstract controller with validation and response helpers
- **Dependency Injection**: TSyringe-based DI container
- **ParamValidator**: Built-in parameter validation system
- **WebService**: Express application wrapper with security defaults
- **Middleware**: Async handler, logger, error handling
- **Testing Utilities**: Mock request/response, controller test helpers
- **Type System**: Complete TypeScript type definitions

### @atriz/auth (Authentication Module)
- **JWTService**: Token generation and verification
- **PasswordService**: Password hashing with bcrypt
- **Auth Middleware**: Factory for creating auth middleware
- **DI Tokens**: Injection tokens for services

### External Dependencies
- **express**: Web framework (v4.18+)
- **tsyringe**: Dependency injection (v4.8+)
- **reflect-metadata**: Required for DI
- **jsonwebtoken**: JWT implementation
- **bcryptjs**: Password hashing
- **helmet**: Security middleware
- **cors**: CORS middleware
- **compression**: Response compression
- **vitest**: Testing framework

## Timezone & Time Handling

**The framework uses UTC for all time operations:**
- All database timestamps stored in UTC (`TIMESTAMP WITH TIME ZONE`)
- Node.js process timezone set to UTC in all applications
- PostgreSQL connections configured to use UTC timezone
- Frontend/client handles timezone conversion for display

**Why UTC?**
- Consistent time handling across different timezones
- Simplified data synchronization across applications
- Easy conversion to any user timezone on the client side
- Prevents daylight saving time issues

## File Structure Patterns

### Framework Package Structure
```
packages/core/
├── src/
│   ├── index.ts              # Main exports
│   ├── service.ts            # WebService class
│   ├── controller/
│   │   ├── BaseController.ts # Base controller class
│   │   └── index.ts
│   ├── di/
│   │   ├── container.ts      # DI container helpers
│   │   ├── tokens.ts         # Injection tokens
│   │   └── index.ts
│   ├── middleware/
│   │   ├── asyncHandler.ts   # Async error handling
│   │   ├── logger.ts         # Request logging
│   │   └── index.ts
│   ├── validators/
│   │   ├── paramValidator.ts # Parameter validation
│   │   ├── common.ts         # Common validators
│   │   └── index.ts
│   ├── testing/
│   │   ├── mockRequest.ts    # Mock Express request
│   │   ├── mockResponse.ts   # Mock Express response
│   │   ├── controllerTestHelper.ts
│   │   └── index.ts
│   ├── types/
│   │   ├── controller.ts     # Controller types
│   │   ├── validation.ts     # Validation types
│   │   └── index.ts
│   └── utils/
│       ├── env.ts            # Environment utilities
│       └── index.ts
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

### Application Structure
```
apps/{app}/
├── src/
│   ├── index.ts              # Entry point, app setup
│   ├── controllers/          # Business controllers
│   │   ├── AuthController.ts
│   │   └── __tests__/
│   ├── routes/               # Route definitions
│   │   ├── auth.routes.ts
│   │   └── index.ts
│   ├── services/             # Business logic (optional)
│   │   └── UserService.ts
│   └── di/                   # DI setup
│       ├── container.ts      # Register services
│       └── tokens.ts         # App-specific tokens
├── env.example
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

## Code Templates

### Controller Template
```typescript
import { Response } from 'express';
import { BaseController, ControllerRequest, ParamDefinition } from '@atriz/core';

interface MyServices {
  userService: UserService;
  emailService: EmailService;
}

/**
 * Example controller extending BaseController
 */
export class CreateUserController extends BaseController<MyServices> {
  constructor(req: ControllerRequest, res: Response, services: MyServices) {
    super(req, res, services);
    this.requiresAuth = false; // Set to true if auth is required
  }

  /**
   * Define and validate parameters
   */
  protected defineParams(): ParamDefinition[] {
    return [
      {
        name: 'email',
        type: 'email',
        required: true,
        errorMessage: 'Valid email is required',
      },
      {
        name: 'password',
        type: 'password',
        required: true,
      },
      {
        name: 'name',
        type: 'string',
        required: true,
        min: 2,
        max: 100,
      },
      {
        name: 'age',
        type: 'number',
        required: false,
        min: 18,
        max: 120,
      },
    ];
  }

  /**
   * Main business logic
   */
  protected async execute(): Promise<any> {
    // Get validated parameters
    const email = this.getParam<string>('email');
    const password = this.getParam<string>('password');
    const name = this.getParam<string>('name');
    const age = this.getParam<number>('age', 25); // with default

    // Use injected services
    const user = await this.services!.userService.createUser({
      email,
      password,
      name,
      age,
    });

    // Send welcome email
    await this.services!.emailService.sendWelcome(user.email);

    // Return data (automatically wrapped in success response)
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }
}
```

### Service Template (Injectable)
```typescript
import { injectable } from 'tsyringe';

/**
 * Example service class with dependency injection
 * Make it injectable with @injectable() decorator
 */
@injectable()
export class UserService {
  constructor(
    // Inject other services if needed
    // private emailService: EmailService
  ) {}

  async getUserById(userId: string) {
    // Your data access logic here
    // Could use Prisma, TypeORM, raw SQL, etc.
    return {
      id: userId,
      email: 'user@example.com',
      name: 'John Doe',
    };
  }

  async createUser(data: CreateUserDto) {
    // Hash password, save to DB, etc.
    const id = crypto.randomUUID();
    
    return {
      id,
      email: data.email,
      name: data.name,
      createdAt: new Date(),
    };
  }

  async updateUser(userId: string, data: UpdateUserDto) {
    // Update logic
    return { success: true };
  }

  async deleteUser(userId: string) {
    // Delete logic
    return { success: true };
  }
}
```

### Route Template
```typescript
import { Router } from 'express';
import { resolve } from '@atriz/core';
import { CreateUserController, GetUserController } from '../controllers';
import { UserService } from '../services/UserService';
import { APP_TOKENS } from '../di/tokens';

export default (): Router => {
  const router = Router();

  // Resolve services from DI container
  const userService = resolve<UserService>(APP_TOKENS.UserService);
  const services = { userService };

  /**
   * POST /api/users
   * Create a new user
   */
  router.post('/', (req, res) => {
    const controller = new CreateUserController(req, res, services);
    return controller.handle();
  });

  /**
   * GET /api/users/:id
   * Get user by ID
   */
  router.get('/:id', (req, res) => {
    const controller = new GetUserController(req, res, services);
    return controller.handle();
  });

  return router;
};
```

### Application Entry Point Template
```typescript
import 'reflect-metadata'; // Required for DI
import { WebService, loadEnv, getEnv, getEnvAsNumber, logger, registerSingleton } from '@atriz/core';
import { JWTService, PasswordService, AUTH_TOKENS } from '@atriz/auth';
import { UserService } from './services/UserService';
import { APP_TOKENS } from './di/tokens';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';

// Load environment variables
loadEnv();

// Initialize services and register in DI container
registerSingleton(AUTH_TOKENS.JWTService, JWTService);
registerSingleton(AUTH_TOKENS.PasswordService, PasswordService);
registerSingleton(APP_TOKENS.UserService, UserService);

// Create and configure app
const webService = new WebService({
  port: getEnvAsNumber('PORT', 3000),
  env: getEnv('NODE_ENV', 'development'),
  cors: {
    origin: getEnv('CORS_ORIGIN', 'http://localhost:5173'),
    credentials: true,
  },
});

// Add custom middleware
webService.app.use(logger);

// Register routes
webService.app.use('/api/auth', authRoutes());
webService.app.use('/api/users', userRoutes());

// Health check
webService.app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
webService.listen();
```

## Validation Patterns

### Parameter Definition Examples
```typescript
protected defineParams(): ParamDefinition[] {
  return [
    // Email validation
    { name: 'email', type: 'email', required: true },
    
    // Password with min length
    { name: 'password', type: 'password', required: true },
    
    // String with length constraints
    { name: 'name', type: 'string', required: true, min: 2, max: 100 },
    
    // Optional number with range
    { name: 'age', type: 'number', required: false, min: 18, max: 120 },
    
    // Phone number
    { name: 'phone', type: 'phone', required: false },
    
    // URL validation
    { name: 'website', type: 'url', required: false },
    
    // UUID
    { name: 'userId', type: 'uuid', required: true },
    
    // Boolean
    { name: 'isActive', type: 'boolean', required: false },
    
    // Date
    { name: 'birthDate', type: 'date', required: false },
    
    // Custom pattern
    {
      name: 'username',
      type: 'string',
      required: true,
      pattern: /^[a-zA-Z0-9_]{3,20}$/,
      errorMessage: 'Username must be 3-20 alphanumeric characters',
    },
    
    // Custom validation function
    {
      name: 'promoCode',
      type: 'string',
      required: false,
      custom: async (value: string) => {
        // Check if promo code exists in DB
        const isValid = await checkPromoCode(value);
        return isValid;
      },
      errorMessage: 'Invalid promo code',
    },
    
    // Object type
    { name: 'metadata', type: 'object', required: false },
    
    // Array type
    { name: 'tags', type: 'array', required: false },
  ];
}
```

### Custom Error Responses
```typescript
protected async execute(): Promise<any> {
  const userId = this.getUrlParam('id');
  
  // Check if resource exists
  const user = await this.services!.userService.findById(userId);
  if (!user) {
    return this.notFound('User not found');
  }
  
  // Check permissions
  if (user.id !== this.userId) {
    return this.forbidden('You do not have permission to access this resource');
  }
  
  // Check for conflicts
  const existingEmail = await this.services!.userService.findByEmail(email);
  if (existingEmail) {
    return this.conflict('Email already in use');
  }
  
  // Success with custom message
  return this.created(user, 'User created successfully');
}
```

## Testing Patterns

### Controller Unit Test
```typescript
import { describe, it, expect, vi } from 'vitest';
import { mockRequest, mockResponse } from '@atriz/core/testing';
import { CreateUserController } from '../CreateUserController';

describe('CreateUserController', () => {
  it('should create user successfully', async () => {
    // Mock services
    const mockUserService = {
      createUser: vi.fn().mockResolvedValue({
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
      }),
    };

    const services = { userService: mockUserService };
    
    // Create mock request/response
    const req = mockRequest({
      body: {
        email: 'test@example.com',
        password: 'Test123!@#',
        name: 'Test User',
      },
    });
    const res = mockResponse();

    // Execute controller
    const controller = new CreateUserController(req, res, services);
    await controller.handle();

    // Assertions
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          user: expect.objectContaining({
            email: 'test@example.com',
          }),
        }),
      })
    );
  });

  it('should return validation error for invalid email', async () => {
    const req = mockRequest({
      body: {
        email: 'invalid-email',
        password: 'Test123!@#',
        name: 'Test User',
      },
    });
    const res = mockResponse();

    const controller = new CreateUserController(req, res, {});
    await controller.handle();

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Validation failed',
      })
    );
  });
});
```

### Service Unit Test
```typescript
import { describe, it, expect } from 'vitest';
import { UserService } from '../UserService';

describe('UserService', () => {
  const userService = new UserService();

  it('should create a user', async () => {
    const userData = {
      email: 'test@example.com',
      password: 'Test123!@#',
      name: 'Test User',
    };

    const user = await userService.createUser(userData);

    expect(user).toHaveProperty('id');
    expect(user.email).toBe(userData.email);
    expect(user.name).toBe(userData.name);
  });
});
```

### Integration Test (API)
```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { webService } from '../src/index';

describe('Auth API', () => {
  let authToken: string;

  it('should register a new user', async () => {
    const response = await request(webService.app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'Test123!@#',
        name: 'Test User',
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('token');
    
    authToken = response.body.data.token;
  });

  it('should access protected route with token', async () => {
    const response = await request(webService.app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
```

## Versioning

### Version Management

Package versions are manually managed in each package's `package.json` file. Framework packages (`@atriz/core`, `@atriz/auth`, `@atriz/storage`, `@atriz/database`) follow semantic versioning.

**Version Bump Types (Semantic Versioning):**
- **Major**: Breaking changes (1.0.0 → 2.0.0)
- **Minor**: New features, backwards compatible (1.0.0 → 1.1.0)
- **Patch**: Bug fixes, small updates (1.0.0 → 1.0.1)

### What Gets Versioned

**Framework Packages** (follow semver):
- `@atriz/core` - Main framework
- `@atriz/auth` - Authentication module
- `@atriz/storage` - File storage module
- `@atriz/database` - Database utilities

**Applications** (private, version as needed):
- `@atriz/website` - Example app
- `@atriz/mextrack-api` - Mextrack API
- `@atriz/pshop-api` - PShop API

### Best Practices

1. **Update CHANGELOG.md** when making significant changes to framework packages
2. **Use semantic versioning** for framework packages
3. **Document breaking changes** clearly in CHANGELOG
4. **Keep package versions in sync** when they depend on each other

## Troubleshooting Guide

### Cannot find module '@atriz/core' or '@atriz/auth'
1. Run `pnpm install` from root
2. Build framework packages: `pnpm build`
3. Check package.json dependencies use `workspace:*`
4. Clear Turbo cache: `turbo daemon clean`

### DI Container Errors ("Cannot resolve...")
1. Ensure `import 'reflect-metadata'` at app entry point
2. Register services before resolving them
3. Check injection tokens match between register and resolve
4. Use `registerSingleton()` for services you want to reuse

### Type errors in IDE
1. Run `pnpm type-check` to see all errors
2. Rebuild packages: `pnpm build`
3. Restart TypeScript server in IDE
4. Check that framework packages are built first

### Controller validation not working
1. Verify `defineParams()` returns correct array
2. Check param names match request body
3. Ensure `required` field is set correctly
4. Test with simple validation first

### Authentication middleware fails
1. Check JWT_SECRET is set in environment
2. Verify token format: `Bearer <token>`
3. Check token expiration
4. Ensure JWTService is registered in DI container

### Tests failing
1. Import `reflect-metadata` in test setup
2. Mock services properly in controller tests
3. Use `mockRequest` and `mockResponse` from `@atriz/core/testing`
4. Clear DI container between tests if needed

### Build errors
1. Build packages in order: `pnpm build`
2. Clean dist folders: `pnpm clean`
3. Check for circular dependencies
4. Verify TypeScript configuration

### Port already in use
1. Kill process: `lsof -ti:3000 | xargs kill -9`
2. Change PORT in .env
3. Check for zombie processes

## Performance Tips

### Framework Usage
- **DI Container**: Use `registerSingleton()` for services to reuse instances
- **Validation**: ParamValidator has built-in SQL injection prevention
- **Response Caching**: Implement at application level for frequently accessed data
- **Lazy Loading**: Only resolve services when needed

### API Development
- Validate input early (handled automatically by BaseController)
- Use pagination for large datasets (implement in services)
- Implement rate limiting (add to application middleware)
- Compress responses (enabled by default in WebService)

### Build & Development
- Use Turbo cache for faster builds
- Run only affected tests: `turbo test --filter=changed`
- Use watch mode: `pnpm dev`
- Build framework packages once, reuse across apps

### Controller Best Practices
- Keep controllers thin, move logic to services
- Reuse validation patterns
- Use dependency injection for testability
- Return early for error conditions

## Security Checklist

- [ ] All secrets in environment variables (JWT_SECRET, etc.)
- [ ] Input validation on all endpoints (via defineParams())
- [ ] SQL injection prevention (built-in with ParamValidator)
- [ ] XSS prevention (sanitize output in services)
- [ ] Helmet enabled (default in WebService)
- [ ] CORS configured properly
- [ ] Rate limiting on auth endpoints (implement in app)
- [ ] HTTPS in production
- [ ] JWT tokens with reasonable expiration
- [ ] Password hashing with bcrypt (PasswordService)
- [ ] Regular dependency updates
- [ ] Strong JWT secrets (long random strings)
- [ ] Validate file uploads (if using file uploads)
- [ ] No sensitive data in logs

## Framework Development Tips

### Adding New Validation Types
```typescript
// In packages/core/src/validators/paramValidator.ts
// Add new case to validateType method
case 'customType':
  return {
    valid: CustomValidators.isValidCustomType(value),
    message: `${paramName} must be a valid custom type`,
  };
```

### Extending BaseController
```typescript
// Create custom base controller for your app
export abstract class MyAppBaseController<T = any> extends BaseController<T> {
  // Add app-specific helpers
  protected async checkPermission(resource: string, action: string) {
    // Custom permission logic
  }
  
  protected getPaginationParams() {
    return {
      page: this.getParam<number>('page', 1),
      limit: this.getParam<number>('limit', 10),
    };
  }
}
```

### Creating Custom Middleware
```typescript
// Add to your application
webService.app.use((req, res, next) => {
  // Custom logging
  console.log(`${req.method} ${req.path}`);
  next();
});
```

## Resources

### Framework Dependencies
- [TSyringe - Dependency Injection](https://github.com/microsoft/tsyringe)
- [Express.js](https://expressjs.com/)
- [Vitest - Testing Framework](https://vitest.dev)
- [TypeScript](https://www.typescriptlang.org/)

### Build Tools
- [Turborepo Documentation](https://turbo.build/repo/docs)
- [pnpm Workspace](https://pnpm.io/workspaces)

### Security
- [Helmet.js](https://helmetjs.github.io/)
- [JWT.io](https://jwt.io/)
- [bcrypt](https://github.com/kelektiv/node.bcrypt.js)

### Testing
- [Supertest - HTTP Testing](https://github.com/ladjs/supertest)
- [Vitest Mocking Guide](https://vitest.dev/guide/mocking.html)

---

## Framework Philosophy

**Atriz Framework** follows these principles:
1. **Framework First**: Build reusable abstractions before application code
2. **Convention over Configuration**: Sensible defaults, easy to override
3. **Type Safety**: Full TypeScript support throughout
4. **Testability**: Built-in testing utilities and DI for easy mocking
5. **Developer Experience**: Minimize boilerplate, maximize productivity
6. **Security by Default**: Security features enabled out of the box

---

**Remember**: Build the framework, then build with the framework. Keep documentation updated as the framework evolves!
