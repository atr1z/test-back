# Mextrack API

Fleet tracking and vehicle management API built with Atriz Framework.

## Features (Planned)

### Core Features
- **Vehicle Management**: CRUD operations for vehicles
- **Real-time Tracking**: GPS tracking and location history
- **Geofencing**: Create zones and track entry/exit events
- **Alerts**: Speed alerts, zone alerts, maintenance reminders
- **Reports**: Trip reports, mileage reports, driver behavior

### Future Features
- **WebSocket Support**: Real-time position updates
- **Route Optimization**: Suggest optimal routes
- **Maintenance Tracking**: Service schedules and history
- **Driver Management**: Driver assignment and behavior tracking
- **Fuel Monitoring**: Fuel consumption and efficiency

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Vehicles
- `GET /api/vehicles` - List all vehicles
- `GET /api/vehicles/:id` - Get vehicle details
- `POST /api/vehicles` - Create vehicle
- `PUT /api/vehicles/:id` - Update vehicle
- `DELETE /api/vehicles/:id` - Delete vehicle

### Tracking
- `GET /api/tracking/:vehicleId` - Get tracking history
- `GET /api/tracking/:vehicleId/latest` - Get latest position
- `POST /api/tracking/:vehicleId` - Add tracking point
- `POST /api/tracking/:vehicleId/batch` - Batch import

### Future Endpoints
- Geofences: `/api/geofences`
- Alerts: `/api/alerts`
- Reports: `/api/reports`

## Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build
pnpm build

# Run tests
pnpm test
```

## Environment Variables

See `env.example` for required configuration.

## Tech Stack

- **Framework**: Atriz Framework (@atriz/core, @atriz/auth)
- **Runtime**: Node.js + TypeScript
- **DI**: TSyringe
- **Validation**: Built-in ParamValidator
- **Testing**: Vitest

## Status

🚧 **In Development** - Skeleton structure only, implementation in progress.

