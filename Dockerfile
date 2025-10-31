# ===================================
# Build Arguments
# ===================================
# APP_NAME: atriz, followsite, or pshop
# APP_PORT: Port to expose (default: 3001)
# Updated: 2025-10-30 18:51 - Fixed tsconfig.json caching
ARG APP_NAME=atriz
ARG APP_PORT=3001

# ===================================
# Stage 1: Dependencies
# ===================================
FROM node:22-alpine AS deps

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY turbo.json ./
COPY tsconfig.json ./

# Copy all workspace packages and apps
COPY packages ./packages
COPY apps ./apps

# Install dependencies
RUN pnpm install --frozen-lockfile

# ===================================
# Stage 2: Builder
# ===================================
FROM node:22-alpine AS builder

# Re-declare build args for this stage
ARG APP_NAME=atriz

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY --from=deps /app/apps ./apps
COPY --from=deps /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml /app/turbo.json /app/tsconfig.json ./

# Build all packages and the specified app
RUN pnpm build --filter=@backend/${APP_NAME}

# ===================================
# Stage 3: Production Runtime
# ===================================
FROM node:22-alpine AS runner

# Re-declare build args for this stage
ARG APP_NAME=atriz
ARG APP_PORT=3001

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

WORKDIR /app

# Set NODE_ENV
ENV NODE_ENV=production
ENV APP_NAME=${APP_NAME}
ENV PORT=${APP_PORT}

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./

# Copy built packages (core dependencies)
COPY --from=builder /app/packages/core/package.json ./packages/core/
COPY --from=builder /app/packages/core/dist ./packages/core/dist

# Copy built app (dynamically based on APP_NAME)
COPY --from=builder /app/apps/${APP_NAME}/package.json ./apps/${APP_NAME}/
COPY --from=builder /app/apps/${APP_NAME}/dist ./apps/${APP_NAME}/dist

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile --filter=@backend/${APP_NAME}...

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 atrizuser

# Change ownership
RUN chown -R atrizuser:nodejs /app

# Switch to non-root user
USER atrizuser

# Expose port (dynamically)
EXPOSE ${APP_PORT}

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:${APP_PORT}/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application (directly with node - no turbo needed in production)
# Code is already built in builder stage
CMD ["sh", "-c", "node apps/${APP_NAME}/dist/index.js"]
