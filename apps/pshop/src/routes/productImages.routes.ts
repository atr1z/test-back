import { Router } from 'express';
import { resolve } from '@atriz/core';
import { uploadSingle, uploadMultiple, StorageService, STORAGE_TOKENS } from '@atriz/storage';
import {
    UploadProductImageController,
    UploadMultipleProductImagesController,
    DeleteProductImageController,
} from '../controllers/ProductImageController';

export default (): Router => {
    const router = Router();

    // Resolve storage service from DI container
    const storageService = resolve<StorageService>(STORAGE_TOKENS.StorageService);
    const services = { storageService };

    /**
     * POST /api/products/images/upload
     * Upload a single product image
     * 
     * Body params:
     * - productId: UUID of the product
     * - isPrimary: Boolean, is this the primary image
     * - description: Optional description
     * 
     * File: 'image' field
     */
    router.post(
        '/upload',
        uploadSingle('image', {
            maxFileSize: 5 * 1024 * 1024, // 5MB
            allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
            allowedExtensions: ['jpg', 'jpeg', 'png', 'webp'],
        }),
        (req, res) => {
            const controller = new UploadProductImageController(req, res, services);
            return controller.handle();
        }
    );

    /**
     * POST /api/products/images/upload-multiple
     * Upload multiple product images (max 5)
     * 
     * Body params:
     * - productId: UUID of the product
     * 
     * Files: 'images' field (multiple)
     */
    router.post(
        '/upload-multiple',
        uploadMultiple('images', 5, {
            maxFileSize: 5 * 1024 * 1024,
            maxFiles: 5,
            allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
            allowedExtensions: ['jpg', 'jpeg', 'png', 'webp'],
        }),
        (req, res) => {
            const controller = new UploadMultipleProductImagesController(req, res, services);
            return controller.handle();
        }
    );

    /**
     * DELETE /api/products/images
     * Delete a product image
     * 
     * Body params:
     * - imageKey: Storage key of the image to delete
     */
    router.delete('/', (req, res) => {
        const controller = new DeleteProductImageController(req, res, services);
        return controller.handle();
    });

    return router;
};

