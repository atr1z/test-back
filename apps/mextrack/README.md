# Mextrack API

Fleet tracking API service for Mextrack.

## Features

- 🔐 Authentication with Lucia Auth
- 🚗 Vehicle management (CRUD operations)
- 📍 GPS tracking data storage and retrieval
- 🔒 Secure session management
- ✅ Input validation with Zod
- 📊 Structured logging

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Vehicles

- `GET /api/vehicles` - List all vehicles
- `GET /api/vehicles/:id` - Get vehicle details
- `POST /api/vehicles` - Create new vehicle
- `PUT /api/vehicles/:id` - Update vehicle
- `DELETE /api/vehicles/:id` - Delete vehicle

### Tracking

- `GET /api/tracking/:vehicleId` - Get tracking data for vehicle
- `POST /api/tracking/:vehicleId` - Add tracking data

## Environment Variables

See `.env.example` for required environment variables.

## Development

```bash
# Install dependencies
pnpm install

# Run in development mode
pnpm dev

# Build
pnpm build

# Start production server
pnpm start

# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch
```

## Deployment

This service is designed to be deployed with Dokploy.

**Build Command:**
```bash
pnpm install && pnpm build
```

**Start Command:**
```bash
node dist/index.js
```
