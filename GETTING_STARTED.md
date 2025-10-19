# Getting Started with Mextrack Backends

Welcome! This guide will help you get the project up and running quickly.

## ⚡ Quick Start (5 minutes)

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Setup Database
```bash
# Create PostgreSQL database
createdb mextrack_dev

# Create test database
createdb mextrack_test
```

### 3. Configure Environment
```bash
# Copy example env files
cp apps/mextrack/.env.example apps/mextrack/.env
cp apps/pshop/.env.example apps/pshop/.env

# Edit .env files with your database credentials
# Minimum required:
# DATABASE_URL=postgresql://user:password@localhost:5432/mextrack_dev
```

### 4. Run Migrations
```bash
pnpm db:migrate
```

### 5. Seed Development Data
```bash
pnpm db:seed
```

### 6. Start Development Servers
```bash
# Start all services
pnpm dev

# Or start individually
pnpm dev:mextrack  # http://localhost:3001
pnpm dev:pshop     # http://localhost:3002
```

## ✅ Verify Installation

### Test API Endpoints

**Mextrack Health Check:**
```bash
curl http://localhost:3001/health
```

**Login with Test User:**
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@mextrack.com","password":"test123456"}'
```

**Run Tests:**
```bash
pnpm test
```

## 📁 Project Structure Overview

```
mextrack-backends/
├── apps/
│   ├── mextrack/          # Fleet tracking API
│   │   ├── src/
│   │   │   ├── controllers/   # Request handlers
│   │   │   ├── services/      # Business logic
│   │   │   ├── routes/        # API routes
│   │   │   └── middleware/    # Express middleware
│   │   └── tests/
│   │
│   └── pshop/             # Point of sale API
│       └── src/
│
├── packages/
│   ├── auth/              # Lucia Auth setup
│   ├── database/          # PostgreSQL + migrations
│   ├── types/             # TypeScript types
│   └── utils/             # Shared utilities
│
└── .cascade/              # Windsurf rules for context
    ├── rules.md           # Project guidelines
    └── context.md         # Quick reference
```

## 🔑 Test Credentials

The seeded database includes test users:

**Test User:**
- Email: `test@mextrack.com`
- Password: `test123456`

**Admin User:**
- Email: `admin@mextrack.com`
- Password: `test123456`

## 🛠️ Common Development Tasks

### Working with Database

**Create a new migration:**
```bash
pnpm db:migrate:create
# Enter migration name (e.g., "add_users_table")
# Edit the generated file in packages/database/src/migrations/
# Run: pnpm db:migrate
```

**Reset database (dev only):**
```bash
pnpm db:reset
pnpm db:migrate
pnpm db:seed
```

### Running Tests

**All tests:**
```bash
pnpm test
```

**Watch mode:**
```bash
pnpm test:watch
```

**With coverage:**
```bash
pnpm test:coverage
```

**Specific service:**
```bash
pnpm test:mextrack
```

### Code Quality

**Lint and fix:**
```bash
pnpm lint:fix
```

**Format code:**
```bash
pnpm format
```

**Type check:**
```bash
pnpm type-check
```

## 📝 Making Your First Change

### Example: Add a New Endpoint to Mextrack

1. **Create a service function** in `apps/mextrack/src/services/`:
```typescript
// myfeature.service.ts
import { sql } from '@mextrack/database';

export async function getMyData(userId: string) {
  return await sql`
    SELECT * FROM my_table 
    WHERE user_id = ${userId}
  `;
}
```

2. **Create a controller** in `apps/mextrack/src/controllers/`:
```typescript
// myfeature.controller.ts
import { Response } from 'express';
import { AuthRequest } from '@mextrack/auth';
import { successResponse, errorResponse } from '@mextrack/utils';
import * as service from '../services/myfeature.service';

export async function getMyData(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return errorResponse(res, 'Unauthorized', 401);
    }
    
    const data = await service.getMyData(req.user.id);
    return successResponse(res, data);
  } catch (error) {
    return errorResponse(res, 'Failed to fetch data', 500);
  }
}
```

3. **Create a route** in `apps/mextrack/src/routes/`:
```typescript
// myfeature.ts
import { Router } from 'express';
import * as controller from '../controllers/myfeature.controller';
import { authMiddleware } from '@mextrack/auth';

const router = Router();
router.use(authMiddleware);
router.get('/', controller.getMyData);

export default router;
```

4. **Register the route** in `apps/mextrack/src/routes/index.ts`:
```typescript
import myFeatureRoutes from './myfeature';

router.use('/myfeature', myFeatureRoutes);
```

5. **Test it:**
```bash
curl http://localhost:3001/api/myfeature \
  -H "Cookie: auth_session=YOUR_SESSION_COOKIE"
```

## 🐛 Troubleshooting

### Issue: "Cannot find module '@mextrack/...'"
**Solution:**
```bash
pnpm install
pnpm build
```

### Issue: Database connection fails
**Solution:**
1. Check PostgreSQL is running: `pg_isready`
2. Verify DATABASE_URL in `.env`
3. Test connection: `psql $DATABASE_URL`

### Issue: Port already in use
**Solution:**
```bash
# Kill process on port 3001
lsof -ti:3001 | xargs kill -9

# Or change PORT in .env file
```

### Issue: Migrations not running
**Solution:**
```bash
# Check migrations table
psql $DATABASE_URL -c "SELECT * FROM migrations;"

# If table doesn't exist, run migrate again
pnpm db:migrate
```

### Issue: TypeScript errors
**Solution:**
```bash
# Check all errors
pnpm type-check

# Rebuild packages
pnpm build
```

## 📚 Next Steps

1. **Explore the codebase**
   - Read `.cascade/rules.md` for project guidelines
   - Check `.cascade/context.md` for code patterns

2. **Complete PShop implementation**
   - Products CRUD operations
   - Sales functionality
   - Inventory management

3. **Add features to Mextrack**
   - Geofencing alerts
   - Real-time tracking with WebSockets
   - Vehicle maintenance tracking

4. **Improve testing**
   - Add more integration tests
   - Increase test coverage
   - Add E2E tests

5. **Add documentation**
   - API documentation with Swagger/OpenAPI
   - Architecture diagrams
   - Deployment guides

## 🔗 Useful Resources

- **Turborepo**: https://turbo.build/repo/docs
- **Lucia Auth**: https://lucia-auth.com
- **postgres.js**: https://github.com/porsager/postgres
- **Zod**: https://zod.dev
- **Vitest**: https://vitest.dev

## 💡 Tips

- Use Turbo's caching for faster builds
- Run `pnpm dev` from root to start all services
- Check logs in the terminal for debugging
- Use Postman or similar for API testing
- Keep test database separate from dev database
- Always run migrations before seeding
- Use TypeScript strict mode features
- Write tests for new features
- Keep packages small and focused

## 🆘 Getting Help

1. Check this guide first
2. Review `.cascade/rules.md` and `.cascade/context.md`
3. Search existing GitHub issues
4. Ask the team

---

**Ready to code?** Run `pnpm dev` and start building! 🚀
