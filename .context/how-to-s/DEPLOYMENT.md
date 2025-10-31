# Dokploy Deployment Guide - Multi-App Monorepo

## Problem Summary

The deployment failed because:

- **Root Cause**: Dokploy's Railpack uses npm, but this is a pnpm workspace monorepo
- **Error**: `npm error Unsupported URL Type "workspace:": workspace:*`
- **Solution**: Use Dockerfile build instead of Railpack

## Architecture Overview

This monorepo contains **3 separate applications** that should be deployed as **3 independent instances**:

| Application    | Package Name          | Port | Status         | Description        |
| -------------- | --------------------- | ---- | -------------- | ------------------ |
| **Atriz**      | `@backend/atriz`      | 3001 | ✅ Implemented | Main backend API   |
| **FollowSite** | `@backend/followsite` | 3002 | 🚧 Placeholder | FollowSite service |
| **PShop**      | `@backend/pshop`      | 3003 | 🚧 Placeholder | POS system         |

All 3 apps share the same `Dockerfile` but use **build arguments** to specify which app to deploy.

---

## 🚀 Steps to Deploy in Dokploy

### 1. **Commit the New Files**

First, commit and push the new Docker configuration:

```bash
git add Dockerfile .dockerignore docker-compose.yml
git commit -m "feat: add Docker configuration for Dokploy deployment"
git push origin main
```

### 2. **Create 3 Separate Applications in Dokploy**

You need to create **3 separate application instances** in Dokploy, one for each app.

> **💡 Tip**: Build Arguments are usually in a separate tab (like "Advanced", "Build Settings", or "Docker") in the Dokploy UI. Look for tabs after selecting Dockerfile as build type.

---

#### **Application 1: Atriz API** ✅

1. **Create New Application**:
    - Name: `atriz-api`
    - Repository: `github.com/atr1z/test-back.git`
    - Branch: `main`

2. **Build Configuration**:
    - Build Type: **Dockerfile** (NOT Railpack)
    - Build Path: `/` (root)
    - Docker File: `Dockerfile`

3. **Build Arguments** (check other tabs if not visible):

    ```
    APP_NAME=atriz
    APP_PORT=3001
    ```

4. **Port Configuration**:
    - Port: `3001`
    - Health Check Path: `/v1/health`

5. **Environment Variables**:

    ```
    NODE_ENV=production
    PORT=3001
    DATABASE_URL=postgresql://user:password@host:5432/atriz_core
    REDIS_URL=redis://host:6379
    ```

6. **Deploy**: Click "Deploy"

---

#### **Application 2: FollowSite API** 🚧

1. **Create New Application**:
    - Name: `followsite-api`
    - Repository: `github.com/atr1z/test-back.git`
    - Branch: `main`

2. **Build Configuration**:
    - Build Type: **Dockerfile**
    - Build Path: `/` (root)
    - Docker File: `Dockerfile`

3. **Build Arguments**:

    ```
    APP_NAME=followsite
    APP_PORT=3002
    ```

4. **Port Configuration**:
    - Port: `3002`
    - Health Check Path: `/v1/health`

5. **Environment Variables**:

    ```
    NODE_ENV=production
    PORT=3002
    DATABASE_URL=postgresql://user:password@host:5432/followsite_db
    ```

6. **Deploy**: Click "Deploy"

---

#### **Application 3: PShop API** 🚧

1. **Create New Application**:
    - Name: `pshop-api`
    - Repository: `github.com/atr1z/test-back.git`
    - Branch: `main`

2. **Build Configuration**:
    - Build Type: **Dockerfile**
    - Build Path: `/` (root)
    - Docker File: `Dockerfile`

3. **Build Arguments**:

    ```
    APP_NAME=pshop
    APP_PORT=3003
    ```

4. **Port Configuration**:
    - Port: `3003`
    - Health Check Path: `/v1/health`

5. **Environment Variables**:

    ```
    NODE_ENV=production
    PORT=3003
    DATABASE_URL=postgresql://user:password@host:5432/pshop_db
    ```

6. **Deploy**: Click "Deploy"

---

### 3. **How It Works**

The Dockerfile uses **build arguments** to determine which app to build:

```dockerfile
# Build arguments
ARG APP_NAME=atriz    # Can be: atriz, followsite, or pshop
ARG APP_PORT=3001     # Different port for each app

# Builds the specified app
RUN pnpm build --filter=@backend/${APP_NAME}

# Copies the built app
COPY --from=builder /app/apps/${APP_NAME}/dist ./apps/${APP_NAME}/dist

# Starts the app
CMD node apps/${APP_NAME}/dist/index.js
```

Each Dokploy application instance points to the **same repository** but builds a **different app** using different build arguments.

---

## 🧪 Test Locally First (Optional)

Before deploying, test the Docker build locally for each app:

### Test Individual Apps

```bash
# Test Atriz
docker build --build-arg APP_NAME=atriz --build-arg APP_PORT=3001 -t atriz-api .
docker run -p 3001:3001 -e NODE_ENV=production -e PORT=3001 atriz-api
curl http://localhost:3001/v1/health

# Test FollowSite
docker build --build-arg APP_NAME=followsite --build-arg APP_PORT=3002 -t followsite-api .
docker run -p 3002:3002 -e NODE_ENV=production -e PORT=3002 followsite-api
curl http://localhost:3002/v1/health

# Test PShop
docker build --build-arg APP_NAME=pshop --build-arg APP_PORT=3003 -t pshop-api .
docker run -p 3003:3003 -e NODE_ENV=production -e PORT=3003 pshop-api
curl http://localhost:3003/v1/health
```

### Test All Apps Together

Use docker-compose to run all 3 apps simultaneously:

```bash
docker-compose up --build

# In another terminal, test all endpoints
curl http://localhost:3001/v1/health  # Atriz
curl http://localhost:3002/v1/health  # FollowSite
curl http://localhost:3003/v1/health  # PShop
```

---

## 📋 Dockerfile Explanation

The Dockerfile uses a **multi-stage build**:

1. **Stage 1 (deps)**: Installs all dependencies with pnpm
2. **Stage 2 (builder)**: Builds the TypeScript code
3. **Stage 3 (runner)**: Creates minimal production image with only:
    - Built code
    - Production dependencies
    - Non-root user for security

### Key Features:

- ✅ Uses pnpm@9.0.0 (matches your packageManager)
- ✅ Handles monorepo workspace dependencies
- ✅ Multi-stage build for smaller image size
- ✅ Non-root user for security
- ✅ Health check included
- ✅ Production-optimized

---

## 🔧 Troubleshooting

### If build still fails:

1. **Check Dockerfile location**:
    - Dockerfile MUST be at repository root
    - Build Path in Dokploy should be `/` (root)

2. **Verify pnpm-lock.yaml exists**:

    ```bash
    git ls-files | grep pnpm-lock.yaml
    ```

3. **Check package.json has packageManager**:

    ```json
    "packageManager": "pnpm@9.0.0"
    ```

4. **View Dokploy build logs**:
    - Look for "Building with Docker" (not Railpack)
    - Should see pnpm commands, not npm

### Common Issues:

**Error: "Cannot find module @atriz/core"**

- Solution: Ensure all packages are built in builder stage
- Check that `COPY --from=builder` includes all packages

**Error: "Port already in use"**

- Solution: Change PORT env variable or container port mapping

**Error: "Health check failing"**

- Solution: Verify `/v1/health` endpoint is accessible
- Check logs: `docker logs <container_id>`

---

## 🎯 Expected Result

After successful deployment of all 3 apps:

### Atriz API

- ✅ Docker build completes without pnpm/npm errors
- ✅ Application starts on port 3001
- ✅ Health check returns 200 OK
- ✅ API accessible at: `https://atriz-api.your-domain.com/v1/health`

### FollowSite API

- ✅ Docker build completes without pnpm/npm errors
- ✅ Application starts on port 3002
- ✅ Health check returns 200 OK
- ✅ API accessible at: `https://followsite-api.your-domain.com/v1/health`

### PShop API

- ✅ Docker build completes without pnpm/npm errors
- ✅ Application starts on port 3003
- ✅ Health check returns 200 OK
- ✅ API accessible at: `https://pshop-api.your-domain.com/v1/health`

**Note**: Each app runs as a **separate container/instance** with its own subdomain and resources.

---

## 📚 Additional Resources

- [Dokploy Docs](https://docs.dokploy.com)
- [pnpm Workspaces](https://pnpm.io/workspaces)
- [Docker Multi-stage Builds](https://docs.docker.com/build/building/multi-stage/)

---

## 🔐 Security Notes

The Dockerfile includes:

- Non-root user (atrizuser:1001)
- Production-only dependencies
- No sensitive files copied (see .dockerignore)
- Health check for monitoring

Remember to:

- Never commit `.env` files
- Use Dokploy's environment variables for secrets
- Enable HTTPS in Dokploy settings

---

## 📷 Dokploy UI Reference

### Where to Set Build Arguments

Based on your experience, Build Arguments are in a **separate tab** in Dokploy:

1. **Build Type**: Select "Dockerfile" ✅
2. **Docker File**: `Dockerfile` (same for all 3 apps)
3. **Docker Context Path**: Leave as `.` (default) or empty
4. **Docker Build Stage**: Leave empty (optional)
5. **Build Arguments**: Look for tabs like:
    - "Advanced" tab
    - "Build Settings" tab
    - "Docker" tab
    - Or similar - it varies by Dokploy version

In the Build Arguments section, add key-value pairs:

```
Key: APP_NAME    Value: atriz     (or followsite, or pshop)
Key: APP_PORT    Value: 3001      (or 3002, or 3003)
```

---

## 📝 Quick Reference

### Build Arguments Summary

| App        | APP_NAME     | APP_PORT | Package Name          |
| ---------- | ------------ | -------- | --------------------- |
| Atriz      | `atriz`      | `3001`   | `@backend/atriz`      |
| FollowSite | `followsite` | `3002`   | `@backend/followsite` |
| PShop      | `pshop`      | `3003`   | `@backend/pshop`      |

### Dokploy Build Configuration (same for all 3 apps)

**Main Settings:**

```
Build Type: Dockerfile
Build Path: /
Docker File: Dockerfile
```

**Build Arguments** (in separate tab):

```
APP_NAME = <app_name>    # atriz, followsite, or pshop
APP_PORT = <port>        # 3001, 3002, or 3003
```

**Environment Variables:**

```
NODE_ENV=production
PORT=<port>
DATABASE_URL=...
```

> **Key Point**: All 3 apps use the **same Dockerfile**, but different **Build Arguments**.

### Local Testing Commands

```bash
# Build specific app
docker build --build-arg APP_NAME=<app_name> --build-arg APP_PORT=<port> -t <app>-api .

# Run all apps
docker-compose up --build
```

---

## 🎓 Key Concepts

1. **One Dockerfile, Multiple Apps**: The Dockerfile uses `ARG APP_NAME` to build different apps from the same monorepo.

2. **Separate Instances**: Each app runs in its own container with its own resources, database, and domain.

3. **Shared Code**: All apps share the `@atriz/core` package and other workspace dependencies.

4. **Independent Scaling**: You can scale each app independently based on its load (e.g., scale atriz to 3 instances, pshop to 2).

5. **Same Repo, Different Apps**: All 3 Dokploy applications point to `github.com/atr1z/test-back.git` but build different apps via build arguments.
