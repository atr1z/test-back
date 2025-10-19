-- Migration: PShop point of sale tables
-- Created at: 2024-01-01

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sku TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    cost DECIMAL(10, 2),
    category TEXT,
    unit TEXT DEFAULT 'unit',
    taxable BOOLEAN DEFAULT TRUE,
    track_inventory BOOLEAN DEFAULT TRUE,
    active BOOLEAN DEFAULT TRUE,
    image_url TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, sku)
);

-- Inventory table
CREATE TABLE IF NOT EXISTS inventory (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity DECIMAL(10, 2) NOT NULL DEFAULT 0,
    min_quantity DECIMAL(10, 2) DEFAULT 0,
    max_quantity DECIMAL(10, 2),
    location TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sales table
CREATE TABLE IF NOT EXISTS sales (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    customer_name TEXT,
    customer_email TEXT,
    customer_phone TEXT,
    subtotal DECIMAL(10, 2) NOT NULL,
    tax DECIMAL(10, 2) NOT NULL DEFAULT 0,
    discount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    total DECIMAL(10, 2) NOT NULL,
    payment_method TEXT CHECK (payment_method IN ('cash', 'card', 'transfer', 'other')),
    status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled', 'refunded')),
    notes TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sale items table
CREATE TABLE IF NOT EXISTS sale_items (
    id TEXT PRIMARY KEY,
    sale_id TEXT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    product_name TEXT NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    discount DECIMAL(10, 2) DEFAULT 0,
    subtotal DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    postal_code TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_products_user_id ON products(user_id);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_active ON products(active);
CREATE INDEX idx_inventory_product_id ON inventory(product_id);
CREATE INDEX idx_sales_user_id ON sales(user_id);
CREATE INDEX idx_sales_created_at ON sales(created_at DESC);
CREATE INDEX idx_sales_status ON sales(status);
CREATE INDEX idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX idx_sale_items_product_id ON sale_items(product_id);
CREATE INDEX idx_customers_user_id ON customers(user_id);
CREATE INDEX idx_customers_email ON customers(email);

-- Triggers for updated_at
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_updated_at
    BEFORE UPDATE ON inventory
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE products IS 'Product catalog for POS system';
COMMENT ON TABLE inventory IS 'Inventory levels for products';
COMMENT ON TABLE sales IS 'Sales transactions';
COMMENT ON TABLE sale_items IS 'Individual items in each sale';
COMMENT ON TABLE customers IS 'Customer information';
