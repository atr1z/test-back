/**
 * PShop-specific DI tokens
 */

export const PSHOP_TOKENS = {
    // Product Management
    ProductService: Symbol.for('ProductService'),
    ProductRepository: Symbol.for('ProductRepository'),
    CategoryService: Symbol.for('CategoryService'),

    // Sales & Transactions
    SaleService: Symbol.for('SaleService'),
    SaleRepository: Symbol.for('SaleRepository'),
    TransactionService: Symbol.for('TransactionService'),

    // Inventory
    InventoryService: Symbol.for('InventoryService'),
    InventoryRepository: Symbol.for('InventoryRepository'),
    StockService: Symbol.for('StockService'),

    // Customers
    CustomerService: Symbol.for('CustomerService'),
    CustomerRepository: Symbol.for('CustomerRepository'),

    // Payment Processing
    PaymentService: Symbol.for('PaymentService'),
    StripeService: Symbol.for('StripeService'),

    // Reporting
    ReportService: Symbol.for('ReportService'),
    AnalyticsService: Symbol.for('AnalyticsService'),

    // Discounts & Promotions (future)
    DiscountService: Symbol.for('DiscountService'),
    PromotionService: Symbol.for('PromotionService'),

    // Email notifications (future)
    EmailService: Symbol.for('EmailService'),
} as const;

export type PShopTokenType = (typeof PSHOP_TOKENS)[keyof typeof PSHOP_TOKENS];
