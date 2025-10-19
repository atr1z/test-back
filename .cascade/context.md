# Mextrack Backends - Project Context

## Quick Reference

### Start Development
```bash
# Install dependencies
pnpm install

# Setup database
createdb mextrack_dev
pnpm db:migrate
pnpm db:seed

# Start all services
pnpm dev

# Start specific service
pnpm dev:mextrack  # Port 3001
pnpm dev:pshop     # Port 3002
```

### Common Commands
```bash
# Development
pnpm dev                    # Start all services
pnpm dev:mextrack          # Start mextrack only
pnpm dev:pshop             # Start pshop only

# Building
pnpm build                 # Build all
pnpm build:mextrack        # Build mextrack
pnpm build:pshop           # Build pshop

# Testing
pnpm test                  # Run all tests
pnpm test:watch            # Watch mode
pnpm test:coverage         # With coverage
pnpm test:mextrack         # Test mextrack only

# Database
pnpm db:migrate            # Run migrations
pnpm db:migrate:create     # Create new migration
pnpm db:seed               # Seed dev data
pnpm db:seed:prod          # Seed prod data
pnpm db:rollback           # Rollback last
pnpm db:reset              # Reset database (dev only)

# Code Quality
pnpm lint                  # Lint all
pnpm lint:fix              # Fix linting issues
pnpm format                # Format code
pnpm format:check          # Check formatting
pnpm type-check            # TypeScript check

# Maintenance
pnpm clean                 # Clean all
pnpm clean:cache           # Clear Turbo cache
```

## Package Dependencies

### Shared Packages
- **@mextrack/auth**: Authentication with Lucia
- **@mextrack/database**: PostgreSQL client and migrations
- **@mextrack/types**: TypeScript type definitions
- **@mextrack/utils**: Utilities (validation, errors, logging, responses)

### External Dependencies
- **lucia**: Authentication library
- **postgres**: PostgreSQL client
- **express**: Web framework
- **zod**: Schema validation
- **winston**: Logging
- **argon2**: Password hashing
- **nanoid**: ID generation
- **vitest**: Testing framework

## File Structure Patterns

### Service Structure
```
apps/{service}/
├── src/
│   ├── controllers/     # HTTP handlers
│   ├── services/        # Business logic
│   ├── routes/          # API routes
│   ├── middleware/      # Request middleware
│   └── index.ts         # Entry point
├── tests/
│   ├── unit/           # Unit tests
│   └── integration/    # Integration tests
├── package.json
├── tsconfig.json
└── .env.example
```

### Shared Package Structure
```
packages/{package}/
├── src/
│   ├── index.ts        # Main export
│   └── *.ts            # Implementation files
├── tests/
│   └── *.test.ts       # Test files
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

## Code Templates

### Controller Template
```typescript
import { Response } from 'express';
import { AuthRequest } from '@mextrack/auth';
import { successResponse, errorResponse } from '@mextrack/utils';
import { z } from 'zod';
import * as service from '../services/myservice.service';

const schema = z.object({
  field: z.string(),
});

export async function handler(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return errorResponse(res, 'Unauthorized', 401);
    }

    const data = schema.parse(req.body);
    const result = await service.doSomething(req.user.id, data);

    return successResponse(res, result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(res, 'Validation error', 400, error.errors);
    }
    return errorResponse(res, 'Operation failed', 500);
  }
}
```

### Service Template
```typescript
import { sql } from '@mextrack/database';
import { nanoid } from 'nanoid';

export async function getData(userId: string) {
  return await sql`
    SELECT * FROM table 
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
  `;
}

export async function createData(userId: string, data: any) {
  const id = nanoid(15);
  
  const result = await sql`
    INSERT INTO table (id, user_id, field)
    VALUES (${id}, ${userId}, ${data.field})
    RETURNING *
  `;
  
  return result[0];
}
```

### Route Template
```typescript
import { Router } from 'express';
import * as controller from '../controllers/my.controller';
import { authMiddleware } from '@mextrack/auth';

const router = Router();

router.use(authMiddleware);

router.get('/', controller.getAll);
router.get('/:id', controller.getOne);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);

export default router;
```

## Database Patterns

### Query Examples
```typescript
// Select
const users = await sql`SELECT * FROM users WHERE id = ${userId}`;
const user = users[0];

// Insert
const [newUser] = await sql`
  INSERT INTO users (id, email, name)
  VALUES (${id}, ${email}, ${name})
  RETURNING *
`;

// Update
const [updated] = await sql`
  UPDATE users 
  SET name = ${name}
  WHERE id = ${userId}
  RETURNING *
`;

// Delete
await sql`DELETE FROM users WHERE id = ${userId}`;

// Transaction
await sql.begin(async (sql) => {
  await sql`INSERT INTO table1 ...`;
  await sql`INSERT INTO table2 ...`;
});

// Dynamic updates
const updates = { name: 'John', email: 'john@example.com' };
await sql`
  UPDATE users 
  SET ${sql(updates)}
  WHERE id = ${userId}
`;
```

### Common Indexes
```sql
-- Foreign keys
CREATE INDEX idx_table_user_id ON table(user_id);

-- Timestamps for sorting
CREATE INDEX idx_table_created_at ON table(created_at DESC);

-- Composite for common queries
CREATE INDEX idx_table_user_date ON table(user_id, created_at DESC);

-- Unique constraints
CREATE UNIQUE INDEX idx_users_email ON users(email);

-- Conditional indexes
CREATE INDEX idx_active_users ON users(id) WHERE active = true;
```

## Testing Patterns

### Unit Test Template
```typescript
import { describe, it, expect } from 'vitest';
import { myFunction } from '../src/mymodule';

describe('MyModule', () => {
  describe('myFunction', () => {
    it('should return expected result', () => {
      const result = myFunction('input');
      expect(result).toBe('expected');
    });

    it('should handle edge case', () => {
      const result = myFunction('');
      expect(result).toBe('default');
    });

    it('should throw on invalid input', () => {
      expect(() => myFunction(null)).toThrow();
    });
  });
});
```

### Integration Test Template
```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/index';
import { sql } from '@mextrack/database';

describe('API Endpoints', () => {
  let authCookie: string;

  beforeAll(async () => {
    // Setup test data
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@test.com', password: 'test123456' });
    
    authCookie = response.headers['set-cookie'][0];
  });

  afterAll(async () => {
    // Cleanup
    await sql`DELETE FROM sessions`;
    await sql.end();
  });

  it('should get data', async () => {
    const response = await request(app)
      .get('/api/resource')
      .set('Cookie', authCookie);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
```

## Troubleshooting Guide

### Cannot find module '@mextrack/...'
1. Run `pnpm install` from root
2. Check package.json dependencies use `workspace:*`
3. Rebuild: `pnpm build`

### Database connection errors
1. Verify DATABASE_URL in .env
2. Check PostgreSQL is running
3. Test connection: `psql $DATABASE_URL`

### Migration fails
1. Check migration SQL syntax
2. Verify dependencies (foreign keys)
3. Check if migration already ran
4. Review logs for specific error

### Type errors in IDE
1. Run `pnpm type-check` to see all errors
2. Rebuild packages: `pnpm build`
3. Restart TypeScript server in IDE

### Tests failing
1. Check if test database is set up
2. Verify .env.test configuration
3. Run migrations on test DB
4. Check for leftover test data

### Port already in use
1. Kill process: `lsof -ti:3001 | xargs kill -9`
2. Change PORT in .env
3. Check for zombie processes

## Performance Tips

### Database
- Use indexes on frequently queried columns
- Limit result sets with LIMIT
- Use transactions for multiple operations
- Consider connection pooling for high traffic

### API
- Validate input early
- Use pagination for large datasets
- Cache frequently accessed data
- Implement rate limiting

### Development
- Use Turbo cache for faster builds
- Run only affected tests during development
- Use `watch` mode for rapid iteration

## Security Checklist

- [ ] All secrets in environment variables
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (sanitize output)
- [ ] CSRF protection (SameSite cookies)
- [ ] Rate limiting on auth endpoints
- [ ] HTTPS in production
- [ ] Secure session cookies
- [ ] Password hashing with Argon2
- [ ] Regular dependency updates

## Useful SQL Queries

### Check migrations status
```sql
SELECT * FROM migrations ORDER BY executed_at DESC;
```

### Count records per user
```sql
SELECT user_id, COUNT(*) as count 
FROM vehicles 
GROUP BY user_id;
```

### Recent activity
```sql
SELECT * FROM tracking 
WHERE timestamp > NOW() - INTERVAL '1 hour'
ORDER BY timestamp DESC 
LIMIT 100;
```

### Find duplicates
```sql
SELECT plate, COUNT(*) 
FROM vehicles 
GROUP BY plate 
HAVING COUNT(*) > 1;
```

### Database size
```sql
SELECT pg_size_pretty(pg_database_size('mextrack_dev'));
```

## Resources

- [Turborepo Documentation](https://turbo.build/repo/docs)
- [Lucia Auth Guide](https://lucia-auth.com)
- [postgres.js Documentation](https://github.com/porsager/postgres)
- [Zod Documentation](https://zod.dev)
- [Vitest Documentation](https://vitest.dev)

---

**Remember**: Always test locally before deploying, keep this documentation updated, and ask for help when needed!
