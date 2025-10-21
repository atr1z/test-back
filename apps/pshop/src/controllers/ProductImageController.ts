import { Response } from 'express';
import { BaseController, ControllerRequest, ParamDefinition } from '@atriz/core';
import { StorageService } from '@atriz/storage';

interface Services {
    storageService: StorageService;
}

/**
 * Upload Product Image Controller
 * Example of file upload with cloud storage
 */
export class UploadProductImageController extends BaseController<Services> {
    constructor(req: ControllerRequest, res: Response, services: Services) {
        super(req, res, services);
        this.requiresAuth = true;
    }

    protected defineParams(): ParamDefinition[] {
        return [
            {
                name: 'productId',
                type: 'uuid',
                required: true,
            },
            {
                name: 'isPrimary',
                type: 'boolean',
                required: false,
            },
            {
                name: 'description',
                type: 'string',
                required: false,
                max: 500,
            },
        ];
    }

    protected async execute(): Promise<any> {
        const productId = this.getParam<string>('productId');
        const isPrimary = this.getParam<boolean>('isPrimary', false);
        const description = this.getParam<string>('description', '');

        // Check if file was uploaded
        if (!this.hasFile()) {
            return this.error('No image file provided', 400);
        }

        const file = this.getFile()!;

        try {
            // Upload to storage
            const uploadResult = await this.services!.storageService.uploadFile(file, {
                path: `products/${productId}/images`,
                acl: 'public-read',
                metadata: {
                    productId,
                    uploadedBy: this.userId!,
                    isPrimary: isPrimary.toString(),
                    description,
                },
            });

            // In a real app, you would save this to database
            // await db.productImages.create({ ... });

            return this.created({
                image: {
                    id: crypto.randomUUID(),
                    productId,
                    url: uploadResult.url,
                    key: uploadResult.key,
                    size: uploadResult.size,
                    contentType: uploadResult.contentType,
                    isPrimary,
                    description,
                    uploadedAt: new Date().toISOString(),
                },
            });
        } catch (error) {
            console.error('Upload failed:', error);
            return this.error('Failed to upload image', 500);
        }
    }
}

/**
 * Upload Multiple Product Images Controller
 */
export class UploadMultipleProductImagesController extends BaseController<Services> {
    constructor(req: ControllerRequest, res: Response, services: Services) {
        super(req, res, services);
        this.requiresAuth = true;
    }

    protected defineParams(): ParamDefinition[] {
        return [
            {
                name: 'productId',
                type: 'uuid',
                required: true,
            },
        ];
    }

    protected async execute(): Promise<any> {
        const productId = this.getParam<string>('productId');

        // Check if files were uploaded
        if (!this.hasFiles()) {
            return this.error('No images provided', 400);
        }

        const files = this.getFiles();

        if (files.length > 5) {
            return this.error('Maximum 5 images allowed', 400);
        }

        try {
            // Upload all files
            const uploadResults = await this.services!.storageService.uploadFiles(files, {
                path: `products/${productId}/images`,
                acl: 'public-read',
                metadata: {
                    productId,
                    uploadedBy: this.userId!,
                },
            });

            // In a real app, you would save these to database
            const images = uploadResults.map((result, index) => ({
                id: crypto.randomUUID(),
                productId,
                url: result.url,
                key: result.key,
                size: result.size,
                contentType: result.contentType,
                isPrimary: index === 0,
                uploadedAt: new Date().toISOString(),
            }));

            return this.created({
                images,
                message: `Successfully uploaded ${images.length} images`,
            });
        } catch (error) {
            console.error('Upload failed:', error);
            return this.error('Failed to upload images', 500);
        }
    }
}

/**
 * Delete Product Image Controller
 */
export class DeleteProductImageController extends BaseController<Services> {
    constructor(req: ControllerRequest, res: Response, services: Services) {
        super(req, res, services);
        this.requiresAuth = true;
    }

    protected defineParams(): ParamDefinition[] {
        return [
            {
                name: 'imageKey',
                type: 'string',
                required: true,
            },
        ];
    }

    protected async execute(): Promise<any> {
        const imageKey = this.getParam<string>('imageKey');

        try {
            // In a real app, you would verify ownership of the image first
            // const image = await db.productImages.findByKey(imageKey);
            // if (image.ownerId !== this.userId) return this.forbidden();

            const deleted = await this.services!.storageService.deleteFile(imageKey);

            if (!deleted) {
                return this.error('Failed to delete image', 500);
            }

            // In a real app, delete from database too
            // await db.productImages.delete(imageKey);

            return this.success({
                message: 'Image deleted successfully',
            });
        } catch (error) {
            console.error('Delete failed:', error);
            return this.error('Failed to delete image', 500);
        }
    }
}

