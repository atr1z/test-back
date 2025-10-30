# GitHub Actions Workflows

This directory contains GitHub Actions workflows for the Atriz API project.

## Workflows

### 1. Atriz Backend CI (`atriz-ci.yml`)

**Triggers:**

- Push to `main`, `develop`, or `v0.0.2` branches
- Pull requests to `main`, `develop`, or `v0.0.2` branches
- Only runs when files in `apps/atriz/`, `packages/core/`, or root config files change

**Jobs:**

#### Test Job

- **Node.js:** 18
- **Package Manager:** pnpm 9.0.0
- **Steps:**
    - Checkout code
    - Setup Node.js and pnpm
    - Cache dependencies
    - Install dependencies
    - Build core package
    - Run type checking
    - Run linting (core package only, with warnings allowed)
    - Run tests
    - Run test coverage

#### Build Job

- **Dependencies:** Requires test job to pass
- **Steps:**
    - Checkout code
    - Setup Node.js and pnpm
    - Cache dependencies
    - Install dependencies
    - Build all packages
    - Upload build artifacts

#### Security Job

- **Steps:**
    - Checkout code
    - Setup Node.js and pnpm
    - Install dependencies
    - Run security audit
    - Check dependencies

#### Code Quality Job

- **Steps:**
    - Checkout code
    - Setup Node.js and pnpm
    - Install dependencies
    - Run Prettier check
    - Run ESLint (core package only)
    - Check TypeScript types

### 2. Atriz Backend Deploy (`atriz-deploy.yml`)

**Triggers:**

- Push to `main` branch (when atriz/core files change)
- Manual trigger via `workflow_dispatch`

**Environment:** `production`

**Steps:**

- Checkout code
- Setup Node.js and pnpm
- Cache dependencies
- Install dependencies
- Build all packages
- Run tests
- Create deployment package
- Upload deployment artifacts
- (Optional) Deploy to server or Docker

## Configuration

### Environment Variables

The workflows use the following environment variables:

- `NODE_VERSION`: '18'
- `PNPM_VERSION`: '9.0.0'

### Secrets (for deployment)

If you want to enable deployment, add these secrets to your repository:

- `HOST`: Server hostname
- `USERNAME`: SSH username
- `SSH_KEY`: SSH private key

### Caching

The workflows use pnpm store caching to speed up dependency installation:

- **Cache Key:** `${{ runner.os }}-pnpm-store-${{ hashFiles('**/pnpm-lock.yaml') }}`
- **Cache Path:** pnpm store directory

## Artifacts

### Build Artifacts

- **Name:** `atriz-build-artifacts`
- **Contents:**
    - `apps/atriz/dist/`
    - `packages/core/dist/`
- **Retention:** 7 days

### Deployment Artifacts

- **Name:** `atriz-deployment-${{ github.sha }}`
- **Contents:** Complete deployment package
- **Retention:** 30 days

## Docker Support

The project includes a `Dockerfile` for containerized deployment:

- **Base Image:** node:18-alpine
- **Multi-stage Build:** Yes
- **Health Check:** Included
- **Non-root User:** Yes (security best practice)

## Local Development

To run the same checks locally:

```bash
# Install dependencies
pnpm install

# Run tests
pnpm test:atriz

# Run tests with coverage
pnpm test:atriz:coverage

# Build packages
pnpm build:atriz

# Run linting
pnpm lint --filter=@atriz/core

# Check formatting
pnpm format:check

# Type checking
pnpm type-check
```

## Troubleshooting

### Common Issues

1. **ESLint Errors:** The workflow allows ESLint warnings to pass but will fail on errors
2. **TypeScript Errors:** All TypeScript errors must be fixed before the build passes
3. **Test Failures:** All tests must pass for the CI to succeed
4. **Build Failures:** Check that all dependencies are properly installed and TypeScript compiles

### Debugging

- Check the Actions tab in your GitHub repository
- Look at the logs for specific error messages
- Run the same commands locally to reproduce issues
- Ensure all environment variables are properly set
