# Contributing to Mextrack Backends

Thank you for contributing to Mextrack Backends! This guide will help you get started.

## 🚀 Getting Started

1. Read the [GETTING_STARTED.md](./GETTING_STARTED.md) guide
2. Review [.cascade/rules.md](./.cascade/rules.md) for project guidelines
3. Check [.cascade/context.md](./.cascade/context.md) for code patterns

## 🌿 Branch Strategy

### Main Branches
- `main` - Production-ready code
- `develop` - Development integration branch

### Feature Branches
- `feature/description` - New features
- `fix/description` - Bug fixes
- `refactor/description` - Code refactoring
- `docs/description` - Documentation updates
- `test/description` - Test additions/updates

### Example
```bash
git checkout develop
git pull origin develop
git checkout -b feature/add-geofencing
```

## 💻 Development Workflow

### 1. Create a Branch
```bash
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name
```

### 2. Make Changes
- Write clean, typed code
- Follow existing patterns
- Add tests for new features
- Update documentation

### 3. Test Your Changes
```bash
# Run tests
pnpm test

# Check types
pnpm type-check

# Lint code
pnpm lint

# Format code
pnpm format
```

### 4. Commit Your Changes
```bash
git add .
git commit -m "type(scope): description"
```

### 5. Push and Create PR
```bash
git push origin feature/your-feature-name
# Create Pull Request on GitHub
```

## 📝 Commit Convention

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Format
```
type(scope): description

[optional body]

[optional footer]
```

### Types
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `style` - Code style changes (formatting, etc.)
- `refactor` - Code refactoring
- `test` - Adding or updating tests
- `chore` - Maintenance tasks

### Scopes
- `mextrack` - Mextrack service
- `pshop` - PShop service
- `auth` - Authentication package
- `database` - Database package
- `types` - Types package
- `utils` - Utils package
- `ci` - CI/CD changes
- `deps` - Dependency updates

### Examples
```bash
feat(mextrack): add geofencing alerts
fix(auth): resolve session refresh issue
docs(readme): update installation steps
test(utils): add validation utility tests
chore(deps): update dependencies
```

## 🧪 Testing Guidelines

### Writing Tests

#### Unit Tests
```typescript
// packages/utils/tests/myfunction.test.ts
import { describe, it, expect } from 'vitest';
import { myFunction } from '../src/myfunction';

describe('myFunction', () => {
  it('should return expected result', () => {
    expect(myFunction('input')).toBe('expected');
  });
});
```

#### Integration Tests
```typescript
// apps/mextrack/tests/integration/endpoint.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/index';

describe('API Endpoint', () => {
  it('should work', async () => {
    const response = await request(app).get('/api/endpoint');
    expect(response.status).toBe(200);
  });
});
```

### Running Tests
```bash
# All tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage
pnpm test:coverage

# Specific package
pnpm test packages/utils
```

### Test Requirements
- All new features must have tests
- Bug fixes should include regression tests
- Aim for 80%+ coverage on critical paths
- Tests should be independent and repeatable

## 🗄️ Database Changes

### Creating Migrations

1. **Create migration file**
```bash
pnpm db:migrate:create
# Enter migration name: "add_geofences_table"
```

2. **Edit the migration**
```sql
-- Migration: Add geofences table
-- Created at: 2024-01-19

CREATE TABLE geofences (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    coordinates JSONB NOT NULL
);

CREATE INDEX idx_geofences_name ON geofences(name);

-- Rollback:
-- DROP TABLE geofences;
```

3. **Run migration**
```bash
pnpm db:migrate
```

4. **Add seed data** (if needed)
```sql
-- packages/database/src/seeds/development/004_geofences.sql
INSERT INTO geofences (id, name, coordinates)
VALUES ('geo_001', 'Test Zone', '{"lat": 19.0, "lng": -98.0}')
ON CONFLICT (id) DO NOTHING;
```

### Migration Rules
- ✅ Always use transactions for complex migrations
- ✅ Add indexes for foreign keys
- ✅ Include rollback instructions in comments
- ✅ Test migrations on copy of production data
- ❌ Never modify existing migrations after they've run
- ❌ Never commit migration changes to main without testing

## 🎨 Code Style

### TypeScript
- Use TypeScript strict mode
- No `any` types (use `unknown` if needed)
- Prefer interfaces over types for objects
- Use const assertions where appropriate

### Formatting
- 2 spaces for indentation
- Single quotes for strings
- Trailing commas in objects/arrays
- 100 character line length
- Run `pnpm format` before committing

### Naming Conventions
- **Files**: kebab-case (`user.service.ts`)
- **Classes**: PascalCase (`UserService`)
- **Functions**: camelCase (`getUserById`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRY_COUNT`)
- **Interfaces**: PascalCase (`User`, `CreateUserDTO`)
- **Types**: PascalCase (`UserId`, `ApiResponse`)

### File Organization
```typescript
// 1. External imports
import { Router } from 'express';
import { z } from 'zod';

// 2. Internal package imports
import { AuthRequest } from '@mextrack/auth';
import { successResponse } from '@mextrack/utils';

// 3. Relative imports
import * as service from '../services/user.service';

// 4. Types/Interfaces
interface UserData {
  name: string;
}

// 5. Constants
const MAX_USERS = 1000;

// 6. Implementation
export function handler() {
  // ...
}
```

## 🔍 Code Review

### Before Requesting Review
- [ ] Code follows project style guide
- [ ] All tests pass locally
- [ ] No linting errors
- [ ] Code is properly formatted
- [ ] Documentation is updated
- [ ] Commit messages follow convention
- [ ] Branch is up to date with develop

### What Reviewers Look For
- Code quality and clarity
- Test coverage
- Performance implications
- Security considerations
- Breaking changes
- Documentation completeness

### Addressing Feedback
- Be receptive to feedback
- Ask questions if unclear
- Make requested changes promptly
- Re-request review after changes

## 📚 Documentation

### Code Documentation
```typescript
/**
 * Retrieves a user by their ID
 * @param userId - The unique identifier of the user
 * @returns The user object or null if not found
 * @throws {NotFoundError} When user doesn't exist
 */
export async function getUserById(userId: string): Promise<User | null> {
  // Implementation
}
```

### API Documentation
Document new endpoints in the service README:
```markdown
### POST /api/endpoint

Create a new resource.

**Request:**
```json
{
  "field": "value"
}
```

**Response:**
```json
{
  "success": true,
  "data": { ... }
}
```
```

## 🐛 Bug Reports

### Creating Issues
1. Check if issue already exists
2. Use issue template (if available)
3. Provide clear title and description
4. Include steps to reproduce
5. Add relevant labels

### Bug Report Template
```markdown
**Describe the bug**
Clear description of what the bug is.

**To Reproduce**
1. Step one
2. Step two
3. See error

**Expected behavior**
What you expected to happen.

**Actual behavior**
What actually happened.

**Environment**
- OS: [e.g., macOS 13.0]
- Node: [e.g., 20.10.0]
- pnpm: [e.g., 8.15.0]

**Additional context**
Any other relevant information.
```

## 🎯 Feature Requests

### Proposing Features
1. Check if feature already requested
2. Create detailed proposal
3. Explain use case and benefits
4. Discuss implementation approach
5. Wait for approval before implementing

### Feature Proposal Template
```markdown
**Feature Description**
Clear description of the proposed feature.

**Problem/Use Case**
What problem does this solve?

**Proposed Solution**
How would this feature work?

**Alternatives Considered**
Other approaches you've thought about.

**Additional Context**
Mockups, examples, references.
```

## 🚫 What NOT to Contribute

- Breaking changes without discussion
- Large refactors without approval
- Dependencies without justification
- Code that doesn't follow style guide
- Features without tests
- Unrelated changes in same PR

## ✅ Checklist Before PR

- [ ] Branch is up to date with develop
- [ ] All tests pass (`pnpm test`)
- [ ] No linting errors (`pnpm lint`)
- [ ] Code is formatted (`pnpm format`)
- [ ] Types are correct (`pnpm type-check`)
- [ ] Documentation is updated
- [ ] Commit messages follow convention
- [ ] PR description is clear and detailed

## 🎉 After Your PR is Merged

- [ ] Delete your feature branch
- [ ] Update your local develop branch
- [ ] Close related issues
- [ ] Celebrate! 🎊

## 📞 Getting Help

- Check [GETTING_STARTED.md](./GETTING_STARTED.md)
- Review [.cascade/context.md](./.cascade/context.md)
- Ask in team chat/discussions
- Create an issue for questions

## 🙏 Thank You!

Your contributions make this project better. We appreciate your time and effort!

---

**Questions?** Check the documentation or reach out to the team.
