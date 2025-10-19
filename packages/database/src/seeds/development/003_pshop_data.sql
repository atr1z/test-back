-- Development seed: PShop test data

-- Test products
INSERT INTO products (id, user_id, sku, name, description, price, cost, category, track_inventory)
VALUES 
    ('product_001', 'user_test_001', 'PROD-001', 'Coffee Mug', 'Ceramic coffee mug 350ml', 15.99, 8.50, 'Kitchenware', true),
    ('product_002', 'user_test_001', 'PROD-002', 'Notebook A5', 'Ruled notebook 100 pages', 5.99, 2.50, 'Stationery', true),
    ('product_003', 'user_test_001', 'PROD-003', 'USB Cable', 'USB-C to USB-A cable 1m', 9.99, 4.00, 'Electronics', true)
ON CONFLICT (id) DO NOTHING;

-- Test inventory
INSERT INTO inventory (id, product_id, quantity, min_quantity)
VALUES 
    ('inventory_001', 'product_001', 50, 10),
    ('inventory_002', 'product_002', 100, 20),
    ('inventory_003', 'product_003', 75, 15)
ON CONFLICT (id) DO NOTHING;

-- Test sale
INSERT INTO sales (id, user_id, customer_name, subtotal, tax, total, payment_method, status)
VALUES 
    ('sale_001', 'user_test_001', 'John Doe', 31.98, 5.12, 37.10, 'card', 'completed')
ON CONFLICT (id) DO NOTHING;

-- Test sale items
INSERT INTO sale_items (id, sale_id, product_id, product_name, quantity, unit_price, subtotal)
VALUES 
    ('sale_item_001', 'sale_001', 'product_001', 'Coffee Mug', 2, 15.99, 31.98)
ON CONFLICT (id) DO NOTHING;
