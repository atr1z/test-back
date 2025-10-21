import { Router } from 'express';
import authRoutes from './auth.routes';
import productRoutes from './product.routes';
import productImagesRoutes from './productImages.routes';
import saleRoutes from './sale.routes';
import inventoryRoutes from './inventory.routes';

export default (): Router => {
    const router = Router();

    // Mount routes
    router.use('/auth', authRoutes());
    router.use('/products', productRoutes());
    router.use('/products/images', productImagesRoutes());
    router.use('/sales', saleRoutes());
    router.use('/inventory', inventoryRoutes());

    // Future routes
    // router.use('/customers', customerRoutes());
    // router.use('/reports', reportRoutes());
    // router.use('/discounts', discountRoutes());

    return router;
};
