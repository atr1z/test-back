# Mextrack Backends - Setup Checklist

Use this checklist to ensure your development environment is properly configured.

## ✅ Prerequisites

- [ ] Node.js 20+ installed (`node --version`)
- [ ] pnpm 8+ installed (`pnpm --version`)
- [ ] PostgreSQL 15+ installed (`psql --version`)
- [ ] Git configured with your credentials
- [ ] Code editor (VS Code, WebStorm, etc.)

## ✅ Initial Setup

### 1. Clone and Install
- [ ] Repository cloned
- [ ] Navigated to project directory
- [ ] Ran `pnpm install`
- [ ] All dependencies installed without errors

### 2. Database Setup
- [ ] PostgreSQL server is running
- [ ] Created development database: `createdb mextrack_dev`
- [ ] Created test database: `createdb mextrack_test`
- [ ] Can connect to databases: `psql mextrack_dev -c "SELECT 1"`

### 3. Environment Configuration
- [ ] Copied `apps/mextrack/.env.example` to `apps/mextrack/.env`
- [ ] Copied `apps/pshop/.env.example` to `apps/pshop/.env`
- [ ] Updated `DATABASE_URL` in both `.env` files
- [ ] Set other environment variables (CORS_ORIGIN, etc.)

### 4. Database Migration
- [ ] Ran `pnpm db:migrate`
- [ ] All 3 migrations executed successfully
- [ ] Verified migrations table: `psql mextrack_dev -c "SELECT * FROM migrations"`

### 5. Seed Data
- [ ] Ran `pnpm db:seed`
- [ ] Test users created
- [ ] Sample data loaded
- [ ] Verified users: `psql mextrack_dev -c "SELECT email FROM users"`

### 6. Build and Test
- [ ] Ran `pnpm build`
- [ ] All packages built successfully
- [ ] Ran `pnpm test`
- [ ] All tests passed
- [ ] Ran `pnpm type-check`
- [ ] No TypeScript errors

### 7. Development Server
- [ ] Ran `pnpm dev`
- [ ] Mextrack service started on port 3001
- [ ] PShop service started on port 3002
- [ ] Both health endpoints respond correctly

## ✅ Verification Tests

### Health Checks
- [ ] Mextrack: `curl http://localhost:3001/health`
  - Expected: `{"status":"ok","service":"mextrack-api","timestamp":"..."}`
- [ ] PShop: `curl http://localhost:3002/health`
  - Expected: `{"status":"ok","service":"pshop-api","timestamp":"..."}`

### Authentication Test
```bash
# Login with test user
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@mextrack.com","password":"test123456"}'
```
- [ ] Login successful
- [ ] Received session cookie
- [ ] User data returned

### Vehicles API Test
```bash
# First, get the session cookie from login above, then:
curl http://localhost:3001/api/vehicles \
  -H "Cookie: auth_session=YOUR_SESSION_COOKIE_HERE"
```
- [ ] Vehicles list returned
- [ ] Contains seeded test vehicles

### Database Test
```bash
# Check tables exist
psql mextrack_dev -c "\dt"
```
- [ ] All tables created (users, sessions, vehicles, tracking, etc.)
- [ ] Indexes created
- [ ] Triggers created

## ✅ Code Quality Checks

### Linting
- [ ] Ran `pnpm lint`
- [ ] No linting errors
- [ ] Ran `pnpm lint:fix` if needed

### Formatting
- [ ] Ran `pnpm format:check`
- [ ] All files properly formatted
- [ ] Ran `pnpm format` if needed

### Type Checking
- [ ] Ran `pnpm type-check`
- [ ] No TypeScript errors in any package

### Testing
- [ ] Unit tests pass: `pnpm test packages/utils`
- [ ] Unit tests pass: `pnpm test packages/auth`
- [ ] Service tests pass: `pnpm test apps/mextrack`
- [ ] Coverage acceptable: `pnpm test:coverage`

## ✅ IDE Configuration (Optional)

### VS Code
- [ ] Install recommended extensions:
  - ESLint
  - Prettier
  - TypeScript and JavaScript Language Features
  - PostgreSQL
- [ ] Enable format on save
- [ ] Configure TypeScript version to use workspace version

### Settings
- [ ] TypeScript errors showing in IDE
- [ ] Auto-import working
- [ ] Code formatting on save enabled
- [ ] ESLint integration working

## ✅ Git Setup

- [ ] Git initialized (should already be done)
- [ ] `.gitignore` configured
- [ ] No sensitive files in git (`git status` shows no .env files)
- [ ] Can commit and push to remote

## ✅ Documentation Review

- [ ] Read `README.md` - Main documentation
- [ ] Read `GETTING_STARTED.md` - Setup guide
- [ ] Read `PROJECT_SUMMARY.md` - What was created
- [ ] Read `.cascade/rules.md` - Project guidelines
- [ ] Skimmed `.cascade/context.md` - Quick reference

## ✅ Optional Setup

### Docker (If needed later)
- [ ] Docker installed
- [ ] Docker Compose installed
- [ ] Can run PostgreSQL in Docker

### Additional Tools
- [ ] Postman or Insomnia for API testing
- [ ] Database GUI (TablePlus, pgAdmin, etc.)
- [ ] Git client (if not using command line)

## 🎯 Development Workflow Test

### Make a Simple Change
- [ ] Created a new branch: `git checkout -b test/setup-verification`
- [ ] Made a small change (e.g., updated a comment)
- [ ] Ran `pnpm lint`
- [ ] Ran `pnpm test`
- [ ] Committed change: `git commit -m "test: verify setup"`
- [ ] Can push to remote (if configured)

### Hot Reload Test
- [ ] With `pnpm dev` running
- [ ] Made a change to a file
- [ ] Server automatically reloaded
- [ ] Change reflected immediately

## 🚨 Common Issues

### Issue: pnpm install fails
- [ ] Check Node.js version: `node --version` (should be 20+)
- [ ] Check pnpm version: `pnpm --version` (should be 8+)
- [ ] Clear pnpm cache: `pnpm store prune`
- [ ] Try again: `pnpm install`

### Issue: Database connection fails
- [ ] PostgreSQL is running: `pg_isready`
- [ ] Database exists: `psql -l | grep mextrack`
- [ ] Connection string is correct in `.env`
- [ ] Can connect manually: `psql $DATABASE_URL`

### Issue: Port already in use
- [ ] Check what's using port: `lsof -i :3001`
- [ ] Kill process: `lsof -ti:3001 | xargs kill -9`
- [ ] Or change PORT in `.env`

### Issue: TypeScript errors
- [ ] Ran `pnpm install` from root
- [ ] Ran `pnpm build` from root
- [ ] Restarted TypeScript server in IDE
- [ ] Ran `pnpm type-check` to see all errors

### Issue: Tests fail
- [ ] Test database exists: `psql -l | grep mextrack_test`
- [ ] DATABASE_URL in `.env.test` is correct
- [ ] Ran migrations on test DB
- [ ] No leftover test data

### Issue: Migrations fail
- [ ] Checked SQL syntax in migration file
- [ ] Verified migration order (001, 002, 003)
- [ ] Checked if migration already ran
- [ ] Reviewed error message carefully

## ✨ Setup Complete!

When all items are checked, you're ready to start development.

### Quick Test Commands
```bash
# Health check all services
curl http://localhost:3001/health && curl http://localhost:3002/health

# Run all quality checks
pnpm lint && pnpm type-check && pnpm test

# Start development
pnpm dev
```

### Next Steps
1. Review `.cascade/rules.md` for development guidelines
2. Check `GETTING_STARTED.md` for your first feature
3. Explore the codebase starting from `apps/mextrack/src/index.ts`
4. Try making a simple change and running tests

---

**Setup Status**: ⏳ In Progress → ✅ Complete

Once everything is checked, you're ready to build amazing features! 🚀
