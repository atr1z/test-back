# Testing Guide for @atriz/core

This document provides comprehensive information about testing the core package using Vitest.

## Overview

The core package uses [Vitest](https://vitest.dev/) as the testing framework, providing fast unit testing with excellent TypeScript support and coverage reporting.

## Test Structure

```
src/
├── utils/
│   ├── env.ts
│   └── env.test.ts          # Tests for environment utilities
├── service/
│   ├── password.ts
│   ├── password.test.ts     # Tests for password service
│   ├── jwt.ts
│   └── jwt.test.ts          # Tests for JWT service
├── middleware/
│   ├── async-handler.ts
│   └── async-handler.test.ts # Tests for async handler middleware
├── model/
│   ├── model.ts
│   └── model.test.ts        # Tests for base model class
├── validators/
│   ├── common.ts
│   └── common.test.ts       # Tests for common validators
└── testing/
    ├── setup.ts             # Global test setup
    ├── mockRequest.ts       # Mock request helpers
    ├── mockResponse.ts      # Mock response helpers
    └── controllerTestHelper.ts # Controller testing utilities
```

## Running Tests

### All Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with UI
pnpm test:ui
```

### Coverage Reports

```bash
# Generate coverage report
pnpm test:coverage

# Coverage will be available in ./coverage/index.html
```

### Specific Test Files

```bash
# Run specific test file
pnpm test src/utils/env.test.ts

# Run tests matching pattern
pnpm test --grep "password"
```

## Test Configuration

### Vitest Config (`vitest.config.ts`)

- **Environment**: Node.js
- **Coverage Provider**: V8
- **Coverage Thresholds**: 80% for all metrics
- **Test Timeout**: 10 seconds
- **Setup File**: `src/testing/setup.ts`

### Coverage Configuration

- **Include**: All TypeScript files in `src/`
- **Exclude**: Test files, examples, index files, and private fields
- **Reports**: Text, JSON, HTML, and LCOV formats
- **Directory**: `./coverage`

## Writing Tests

### Test File Naming

- Unit tests: `*.test.ts`
- Integration tests: `*.spec.ts`
- Place test files next to the source files they test

### Test Structure

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { YourClass } from './your-class';

describe('YourClass', () => {
    let instance: YourClass;

    beforeEach(() => {
        instance = new YourClass();
    });

    describe('methodName', () => {
        it('should do something', () => {
            // Arrange
            const input = 'test';

            // Act
            const result = instance.methodName(input);

            // Assert
            expect(result).toBe('expected');
        });
    });
});
```

### Mocking

```typescript
// Mock external dependencies
vi.mock('external-library', () => ({
    externalFunction: vi.fn(),
}));

// Mock environment variables
vi.stubEnv('TEST_VAR', 'test-value');

// Mock functions
const mockFn = vi.fn();
mockFn.mockReturnValue('mocked value');
```

### Async Testing

```typescript
it('should handle async operations', async () => {
    const result = await asyncFunction();
    expect(result).toBeDefined();
});

it('should handle async errors', async () => {
    await expect(asyncFunction()).rejects.toThrow('Error message');
});
```

## Test Categories

### Unit Tests

- Test individual functions and methods
- Mock external dependencies
- Focus on single responsibility
- Fast execution

### Integration Tests

- Test component interactions
- Use real dependencies where appropriate
- Test data flow between components

### Service Tests

- Test business logic
- Mock external services (databases, APIs)
- Test error handling and edge cases

## Coverage Goals

- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%
- **Statements**: 80%

## Best Practices

### 1. Test Naming

- Use descriptive test names
- Follow the pattern: "should [expected behavior] when [condition]"
- Group related tests with `describe` blocks

### 2. Test Organization

- One test file per source file
- Group tests by functionality
- Use `beforeEach` for common setup

### 3. Assertions

- Use specific matchers (`toBe`, `toEqual`, `toContain`)
- Test both positive and negative cases
- Verify error conditions

### 4. Mocking Strategy

- Mock external dependencies
- Use real implementations for internal code
- Avoid over-mocking

### 5. Test Data

- Use realistic test data
- Test edge cases and boundary conditions
- Clean up test data after tests

## Continuous Integration

Tests run automatically on:

- Push to `main`, `develop`, or `v0.0.2` branches
- Pull requests to these branches
- Changes to `packages/**` directory

### GitHub Actions Workflow

- **Framework Tests**: Runs all tests with coverage
- **Code Quality**: Runs linting and type checking
- **Security Audit**: Checks for vulnerabilities

## Debugging Tests

### VS Code Integration

1. Install the Vitest extension
2. Use the test explorer to run individual tests
3. Set breakpoints in test files
4. Use the debug console for inspection

### Command Line Debugging

```bash
# Run tests with verbose output
pnpm test --reporter=verbose

# Run specific test with debug info
pnpm test --run src/utils/env.test.ts
```

## Performance Testing

For performance-critical code, add performance tests:

```typescript
it('should complete within time limit', () => {
    const start = performance.now();
    // ... perform operation
    const end = performance.now();

    expect(end - start).toBeLessThan(100); // 100ms limit
});
```

## Troubleshooting

### Common Issues

1. **Tests not running**: Check file naming and imports
2. **Coverage not generated**: Ensure tests are actually running
3. **Mock not working**: Verify mock setup and timing
4. **Async test failures**: Check for proper async/await usage

### Getting Help

- Check the [Vitest documentation](https://vitest.dev/)
- Review existing test files for patterns
- Ask the development team for guidance

## Contributing

When adding new features:

1. Write tests first (TDD approach)
2. Ensure all tests pass
3. Maintain or improve coverage
4. Update this documentation if needed

Remember: **Good tests are an investment in code quality and maintainability!**
