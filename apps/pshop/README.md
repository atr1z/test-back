# PShop API

Point of sale API service for PShop.

## Features

- 🔐 Authentication with Lucia Auth
- 📦 Product management
- 💰 Sales transactions
- 📊 Inventory tracking
- ✅ Input validation

## API Endpoints

### Authentication

- `GET /api/auth/me` - Get current user

### Products

- `GET /api/products` - List products
- `POST /api/products` - Create product

### Sales

- `GET /api/sales` - List sales
- `POST /api/sales` - Create sale

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
```

## Note

This is a basic structure. Full implementation coming soon.
