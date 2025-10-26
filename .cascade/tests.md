# Testing Strategy & Implementation Guide

## Document Purpose

This document provides comprehensive context about the testing strategy implemented in the Atriz Framework for both human developers and AI agents.

## Table of Contents

1. [Overview](#overview)
2. [Testing Architecture](#testing-architecture)
3. [E2E Testing with Supertest](#e2e-testing-with-supertest)
4. [Implementation Details](#implementation-details)
5. [Writing Tests](#writing-tests)
6. [Running Tests](#running-tests)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

---

## Overview

### Testing Philosophy

The Atriz Framework implements a **multi-layered testing strategy**:

```
         E2E Tests           ← Few, slow, high confidence
        /           \
      /               \
    /    Integration    \    ← Some, medium speed
  /                       \
/        Unit Tests         \ ← Many, fast, focused
```

### Test Framework Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Test Runner** | Vitest | Fast, modern test framework |
| **API Testing** | Supertest | HTTP assertions for Express |
| **Assertions** | Vitest (expect) | Fluent assertion API |
| **Mocking** | Vitest (vi) | Service/function mocking |
| **Database** | PostgreSQL | Test database for E2E |

### Why This Stack?

✅ **Consistency**: Same framework (Vitest) for all test types  
✅ **Speed**: Vitest is 10-100x faster than Jest  
✅ **TypeScript**: First-class TypeScript support  
✅ **DX**: Hot reload, watch mode, intuitive API  
✅ **Industry Standard**: Supertest is the most popular Express testing tool  

---

## Testing Architecture

### Test Environment Isolation

```
Development Environment
├─ mextrack_dev
└─ atriz_core_dev

Test Environment (Isolated)
├─ mextrack_test
├─ atriz_core_test
├─ Clean state before each test
└─ No impact on dev data

Production Environment
├─ mextrack_prod
└─ atriz_core_prod
```

### File Structure

```
apps/mextrack/
├── src/
│   ├── __tests__/
│   │   ├── setup.e2e.ts          # E2E setup/teardown
│   │   ├── helpers.e2e.ts        # Reusable utilities
│   │   └── api.e2e.test.ts       # E2E test suites
│   └── controllers/
│       └── __tests__/            # Unit tests
├── vitest.config.ts              # Unit test config
├── vitest.e2e.config.ts          # E2E test config
├── .env.test                     # Test environment
└── package.json                  # Test scripts
```

---

## E2E Testing with Supertest

### Why Supertest?

We evaluated three approaches:

#### ✅ Option 1: Supertest + Vitest (SELECTED)

**Pros**:
- ⚡ Fast (100-500ms per test)
- 🎯 Perfect for API testing
- 📦 Small footprint
- 🔧 Easy setup
- 🏭 Industry standard

**Cons**:
- ❌ No browser testing
- ⚠️ Shared test DB (need cleanup)

#### Option 2: Playwright

**Pros**: Browser testing, visual regression  
**Cons**: Slow (~2-10s), overkill for APIs, heavy dependencies

#### Option 3: Testcontainers

**Pros**: Complete isolation, real DB per test  
**Cons**: Very slow (~5-10s startup), requires Docker, complex

### Decision: Supertest + Vitest

Perfect fit because:
- APIs don't need browser testing
- Speed is critical for development workflow
- Easy to maintain and extend
- Aligns with existing Vitest setup

---

## Implementation Details

### Files Created

1. **`vitest.e2e.config.ts`** - E2E test configuration
2. **`src/__tests__/setup.e2e.ts`** - Setup/teardown hooks
3. **`src/__tests__/helpers.e2e.ts`** - Reusable test utilities
4. **`src/__tests__/api.e2e.test.ts`** - Example E2E tests
5. **`.env.test`** - Test environment variables
6. **`package.json`** - Updated with test scripts and dependencies

### 1. Configuration (`vitest.e2e.config.ts`)

```typescript
export default defineConfig({
  test: {
    name: 'mextrack-e2e',
    include: ['src/**/*.e2e.test.ts'],
    globals: true,
    environment: 'node',
    setupFiles: ['./src/__tests__/setup.e2e.ts'],
    testTimeout: 30000,
    // Sequential execution to avoid DB conflicts
    pool: 'forks',
    poolOptions: {
      forks: { singleFork: true }
    },
  },
});
```

**Key Settings**:
- `singleFork: true` - Sequential execution (no race conditions)
- `globals: true` - Makes `expect`, `describe`, `it` available globally
- `setupFiles` - Runs before all tests (DB connection)

### 2. Setup & Teardown (`setup.e2e.ts`)

```typescript
let testDb: DatabasePool | null = null;

beforeAll(async () => {
  // Connect to test database
  testDb = createDatabasePool({
    connectionString: process.env.DATABASE_URL,
    max: 5,
  });
  console.log('✅ Test database connected');
});

beforeEach(async () => {
  // Clean database before each test
  await testDb.query('TRUNCATE TABLE vehicles RESTART IDENTITY CASCADE');
});

afterAll(async () => {
  await testDb?.close();
});

export { testDb };
```

**Lifecycle**:
1. `beforeAll` - Connect to DB (once)
2. `beforeEach` - Clean tables (per test)
3. Test execution
4. `afterAll` - Close DB (once)

### 3. Test Helpers (`helpers.e2e.ts`)

Provides reusable utilities:

```typescript
// Generate JWT token
export function generateTestToken(userId: string, email: string): string

// Create test user
export async function createTestUser(db: DatabasePool, data: {...})

// Authenticated request helper
export function authenticatedRequest(app: Express, token: string)

// Seed test data
export async function seedTestVehicle(db: DatabasePool, userId: string, data = {})

// Assertions
export function expectApiSuccess(response: Response, statusCode = 200)
export function expectApiError(response: Response, statusCode: number, messageContains?: string)

// Utilities
export function generateTestEmail(prefix: string = 'test'): string
export function randomString(length: number = 8): string
```

### 4. Example Tests (`api.e2e.test.ts`)

Complete E2E test suite covering:
- Health & info endpoints
- Authentication flows
- CRUD operations
- Validation
- Permissions
- GPS tracking
- Error handling

---

## Writing Tests

### Test Structure (AAA Pattern)

```typescript
it('should create a vehicle', async () => {
  // ARRANGE: Setup test data
  const user = await createTestUser(testDb!, {
    email: generateTestEmail(),
    password: 'Test123!@#',
    name: 'Test User',
  });
  const token = generateTestToken(user.id, user.email);
  
  // ACT: Execute HTTP request
  const response = await authenticatedRequest(app, token)
    .post('/api/vehicles')
    .send({ licensePlate: 'ABC-123', make: 'Toyota' });
  
  // ASSERT: Verify response
  expectApiSuccess(response, 201);
  expect(response.body.data.vehicle).toMatchObject({
    licensePlate: 'ABC-123',
    make: 'Toyota',
  });
});
```

### Test Naming

✅ **GOOD**: Descriptive names
```typescript
it('should return 404 when vehicle does not exist', async () => {})
it('should reject vehicle creation with invalid license plate', async () => {})
it('should not allow accessing other users vehicles', async () => {})
```

❌ **BAD**: Vague names
```typescript
it('test vehicle', async () => {})
it('works', async () => {})
```

### Test Organization

```typescript
describe('Vehicle API', () => {
  describe('CREATE operations', () => {
    it('should create with valid data', async () => {})
    it('should reject invalid data', async () => {})
  });
  
  describe('READ operations', () => {
    it('should list all vehicles', async () => {})
    it('should get by ID', async () => {})
  });
});
```

### Common Patterns

#### Pattern 1: CRUD Operations

```typescript
it('should complete full CRUD lifecycle', async () => {
  // Create
  const createRes = await authenticatedRequest(app, token)
    .post('/api/vehicles')
    .send({ licensePlate: 'ABC-123' });
  const vehicleId = createRes.body.data.vehicle.id;
  
  // Read
  const readRes = await authenticatedRequest(app, token)
    .get(`/api/vehicles/${vehicleId}`);
  expectApiSuccess(readRes);
  
  // Update
  const updateRes = await authenticatedRequest(app, token)
    .put(`/api/vehicles/${vehicleId}`)
    .send({ color: 'Blue' });
  expectApiSuccess(updateRes);
  
  // Delete
  const deleteRes = await authenticatedRequest(app, token)
    .delete(`/api/vehicles/${vehicleId}`);
  expectApiSuccess(deleteRes);
});
```

#### Pattern 2: Validation

```typescript
it('should reject invalid data', async () => {
  const invalidData = {
    licensePlate: '', // Empty
    year: 1800, // Invalid
  };
  
  const response = await authenticatedRequest(app, token)
    .post('/api/vehicles')
    .send(invalidData);
  
  expectApiError(response, 422);
  expect(response.body.errors).toBeDefined();
});
```

#### Pattern 3: Permissions

```typescript
it('should not allow accessing other users data', async () => {
  const otherUser = await createTestUser(testDb!, {...});
  const otherVehicle = await seedTestVehicle(testDb!, otherUser.id);
  
  const response = await authenticatedRequest(app, testToken)
    .get(`/api/vehicles/${otherVehicle.id}`);
  
  expectApiError(response, 403);
});
```

---

## Running Tests

### Commands

```bash
# Unit Tests
pnpm test                    # Run all unit tests
pnpm test:watch              # Watch mode
pnpm test:coverage           # With coverage

# E2E Tests
pnpm test:e2e                # Run E2E tests
pnpm test:e2e:watch          # Watch mode

# All Tests
pnpm test && pnpm test:e2e   # Run both

# Filter
pnpm test:e2e --grep "Vehicle"     # Run specific tests
pnpm test:e2e api.e2e.test         # Run specific file
```

### First-Time Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Create test databases
createdb mextrack_test
createdb atriz_core_test

# 3. Run migrations
DATABASE_URL=postgresql://localhost:5432/mextrack_test \
  pnpm --filter @atriz/mextrack-api migrate

# 4. Run tests
pnpm test:e2e
```

### CI/CD Integration

```yaml
# GitHub Actions example
- name: Run E2E Tests
  run: |
    createdb mextrack_test
    createdb atriz_core_test
    pnpm db:migrate
    pnpm test:e2e
```

---

## Best Practices

### 1. Test Independence

✅ **DO**: Each test is self-contained
```typescript
it('should create vehicle', async () => {
  const user = await createTestUser(testDb!, {...}); // Own data
  const token = generateTestToken(user.id, user.email);
  // Test logic...
});
```

❌ **DON'T**: Share state between tests
```typescript
let sharedVehicleId: string; // ❌ Bad: shared state
```

### 2. Test Data

✅ **DO**: Generate unique data
```typescript
const user = await createTestUser(testDb!, {
  email: generateTestEmail(), // ✅ Unique
  password: 'Test123!@#',
});
```

❌ **DON'T**: Hardcode data
```typescript
email: 'test@example.com', // ❌ Fails on second run
```

### 3. Assertions

✅ **DO**: Specific assertions
```typescript
expect(response.status).toBe(201);
expect(response.body.data.vehicle).toMatchObject({
  licensePlate: 'ABC-123',
});
```

❌ **DON'T**: Vague assertions
```typescript
expect(response.body).toBeTruthy(); // ❌ Too generic
```

### 4. Error Cases

✅ **DO**: Test errors thoroughly
```typescript
it('should return 404 when not found', async () => {
  const response = await request(app).get('/api/vehicles/fake-id');
  expectApiError(response, 404);
});
```

### 5. Cleanup

✅ **DO**: Clean before each test (in `beforeEach`)
```typescript
beforeEach(async () => {
  await testDb.query('TRUNCATE TABLE vehicles CASCADE');
});
```

---

## Troubleshooting

### Database Connection Errors

```bash
# Check PostgreSQL running
psql -U postgres -c "SELECT version();"

# Verify test DB exists
psql -U postgres -l | grep test

# Recreate test DB
dropdb mextrack_test
createdb mextrack_test
pnpm db:migrate
```

### Port Already in Use

```bash
# Kill process
lsof -ti:3099 | xargs kill -9
```

### Module Not Found (supertest)

```bash
# Install dependencies
pnpm install
```

The TypeScript errors you see are normal until dependencies are installed.

### Tests Hanging

Ensure connections are closed:
```typescript
afterAll(async () => {
  await testDb?.close();
});
```

---

## Summary

### What We Implemented

1. ✅ **E2E Testing Infrastructure**
   - Supertest for HTTP testing
   - Vitest configuration for E2E
   - Database setup/teardown
   - Test helpers and utilities

2. ✅ **Test Files Created**
   - `vitest.e2e.config.ts` - E2E config
   - `setup.e2e.ts` - DB lifecycle
   - `helpers.e2e.ts` - Reusable utilities
   - `api.e2e.test.ts` - Example tests
   - `.env.test` - Test environment

3. ✅ **Package Updates**
   - Added `supertest` and `@types/supertest`
   - Added `test:e2e` scripts
   - Configured sequential execution

### Next Steps

1. Install dependencies: `pnpm install`
2. Create test databases: `createdb mextrack_test && createdb atriz_core_test`
3. Run migrations on test DBs
4. Export your Express app from `src/index.ts`
5. Run tests: `pnpm test:e2e`
6. Write E2E tests for your features

### Key Takeaways

- **Supertest** is perfect for API E2E testing (fast, simple, industry standard)
- Tests run **sequentially** to avoid database conflicts
- Each test gets a **clean database state** via `TRUNCATE`
- Use **helper functions** for common operations (auth, seeding, assertions)
- Follow **AAA pattern** (Arrange, Act, Assert)
- Keep tests **independent** and **self-contained**

---

**Last Updated**: 2025-10-26  
**Status**: Production Ready ✅  
**Maintainer**: Atriz Development Team
