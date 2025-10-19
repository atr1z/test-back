# PShop API

Point of Sale and inventory management API built with Atriz Framework.

## Features (Planned)

### Core Features
- **Product Management**: CRUD operations for products, categories, variants
- **Sales Processing**: Complete checkout flow with multiple payment methods
- **Inventory Management**: Stock tracking, low stock alerts, adjustments
- **Customer Management**: Customer profiles, purchase history, loyalty
- **Reporting**: Sales reports, inventory reports, analytics

### Future Features
- **Payment Integration**: Stripe, PayPal, cash, card
- **Receipt Generation**: PDF receipts, email receipts
- **Barcode Support**: Barcode scanning and generation
- **Multi-location**: Support for multiple store locations
- **Employee Management**: Staff access, permissions, time tracking
- **Discounts & Promotions**: Coupons, bulk discounts, loyalty rewards
- **Tax Calculation**: Automatic tax calculation based on location
- **Return & Refund**: Complete return/refund workflow

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Products
- `GET /api/products` - List all products
- `GET /api/products/:id` - Get product details
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `GET /api/products/:id/stock` - Get stock levels

### Sales
- `GET /api/sales` - List sales
- `GET /api/sales/:id` - Get sale details
- `POST /api/sales` - Create sale (checkout)
- `POST /api/sales/:id/refund` - Process refund
- `GET /api/sales/daily-summary` - Daily summary

### Inventory
- `GET /api/inventory` - Inventory overview
- `GET /api/inventory/:productId` - Product inventory
- `POST /api/inventory/:productId/adjust` - Adjust stock
- `GET /api/inventory/low-stock` - Low stock alerts
- `GET /api/inventory/history/:productId` - Movement history

### Future Endpoints
- Customers: `/api/customers`
- Reports: `/api/reports`
- Discounts: `/api/discounts`
- Categories: `/api/categories`

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

