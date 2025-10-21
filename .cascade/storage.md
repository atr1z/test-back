# @atriz/storage - File Upload & Cloud Storage Package

## Package Overview

**Package Name**: `@atriz/storage`  
**Version**: 0.1.0  
**Purpose**: File upload and cloud storage management for Atriz Framework  
**Status**: Production Ready ✅

### What It Does

The storage package provides a complete solution for handling file uploads and managing cloud storage in Atriz applications. It abstracts away the complexity of working with different storage providers (S3, Digital Ocean Spaces, Minio) and provides a unified, easy-to-use API.

### Key Features

- 📦 **Multiple Storage Providers**: S3-compatible (AWS, Digital Ocean Spaces) and Minio
- 🔒 **Signed URLs**: Generate temporary URLs for private file access
- ✅ **File Validation**: MIME type, file size, and extension validation
- 🚀 **Easy Integration**: Works seamlessly with BaseController
- 🔧 **Dependency Injection**: Full TSyringe integration
- 📝 **TypeScript**: Complete type safety
- 🧪 **Well Tested**: 41 passing tests with high coverage

---

## Architecture

### Package Structure

```
packages/storage/
├── src/
│   ├── providers/
│   │   ├── StorageProvider.ts      # Interface for all providers
│   │   ├── S3Provider.ts            # AWS S3 / Digital Ocean Spaces
│   │   └── MinioProvider.ts         # Minio for local dev
│   ├── services/
│   │   ├── StorageService.ts        # Main service (injectable)
│   │   └── FileValidator.ts         # File validation utilities
│   ├── middleware/
│   │   └── uploadMiddleware.ts      # Multer integration
│   ├── types/
│   │   ├── storage.ts               # Storage-related types
│   │   └── upload.ts                # Upload-related types
│   ├── di/
│   │   └── tokens.ts                # DI injection tokens
│   ├── utils/
│   │   └── fileHelpers.ts           # Utility functions
│   ├── __tests__/                   # Test suites
│   └── index.ts                     # Main exports
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── README.md
└── CHANGELOG.md
```

### Core Components

#### 1. Storage Providers

**StorageProvider Interface**
```typescript
interface StorageProvider {
  upload(file: Express.Multer.File, options?: UploadOptions): Promise<UploadResult>;
  uploadMultiple(files: Express.Multer.File[], options?: UploadOptions): Promise<UploadResult[]>;
  delete(fileKey: string, bucket?: string): Promise<boolean>;
  deleteMultiple(fileKeys: string[], bucket?: string): Promise<boolean[]>;
  getSignedUrl(fileKey: string, expiresIn?: number, bucket?: string): Promise<string>;
  getPublicUrl(fileKey: string, bucket?: string): string;
  exists(fileKey: string, bucket?: string): Promise<boolean>;
  getMetadata(fileKey: string, bucket?: string): Promise<Record<string, any>>;
}
```

**S3Provider**
- Supports AWS S3 and Digital Ocean Spaces
- S3-compatible storage services
- Custom endpoint support
- ACL support (private, public-read, public-read-write)
- Automatic key generation with timestamp + random string
- Full metadata support

**MinioProvider**
- Local development and self-hosted storage
- Automatic bucket creation
- Compatible with S3 API
- Perfect for development workflow

#### 2. Services

**StorageService**
```typescript
@injectable()
class StorageService {
  constructor(@inject(STORAGE_TOKENS.Provider) private provider: StorageProvider) {}
  
  uploadFile(file: Express.Multer.File, options?: UploadOptions): Promise<UploadResult>
  uploadFiles(files: Express.Multer.File[], options?: UploadOptions): Promise<UploadResult[]>
  deleteFile(fileKey: string, bucket?: string): Promise<boolean>
  deleteFiles(fileKeys: string[], bucket?: string): Promise<boolean[]>
  getSignedUrl(fileKey: string, expiresIn?: number, bucket?: string): Promise<string>
  getPublicUrl(fileKey: string, bucket?: string): string
  fileExists(fileKey: string, bucket?: string): Promise<boolean>
  getFileMetadata(fileKey: string, bucket?: string): Promise<Record<string, any>>
}
```

**FileValidator**
```typescript
class FileValidator {
  static validateFile(file: Express.Multer.File, config: FileValidationConfig): FileValidationResult
  static validateFiles(files: Express.Multer.File[], config: FileValidationConfig): FileValidationResult
}
```

#### 3. Upload Middleware

```typescript
// Single file upload
uploadSingle(fieldName: string, config?: UploadMiddlewareConfig): RequestHandler

// Multiple files from one field
uploadMultiple(fieldName: string, maxCount: number, config?: UploadMiddlewareConfig): RequestHandler

// Files from multiple fields
uploadFields(fields: UploadField[], config?: UploadMiddlewareConfig): RequestHandler

// Accept any files
uploadAny(config?: UploadMiddlewareConfig): RequestHandler
```

**Configuration Options**:
- `maxFileSize`: Maximum file size in bytes
- `maxFiles`: Maximum number of files
- `allowedMimeTypes`: Array of allowed MIME types
- `allowedExtensions`: Array of allowed file extensions

---

## Setup & Configuration

### 1. Install Dependencies

The package is already included in the monorepo. For apps that need it:

```json
{
  "dependencies": {
    "@atriz/storage": "workspace:*"
  }
}
```

### 2. Environment Variables

```bash
# Choose provider: 'minio' for local, 's3' for production
STORAGE_PROVIDER=minio

# Minio Configuration (Local Development)
MINIO_ENDPOINT=http://localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=uploads

# Digital Ocean Spaces Configuration (Production)
DO_SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com
DO_SPACES_REGION=nyc3
DO_SPACES_KEY=your-access-key
DO_SPACES_SECRET=your-secret-key
DO_SPACES_BUCKET=production-bucket
```

### 3. Setup Storage Provider (DI Configuration)

```typescript
// apps/your-app/src/di/setupStorage.ts
import { registerInstance, registerSingleton, getEnv } from '@atriz/core';
import {
  StorageService,
  S3Provider,
  MinioProvider,
  StorageProvider,
  STORAGE_TOKENS,
} from '@atriz/storage';

export function setupStorage(): void {
  const provider = getEnv('STORAGE_PROVIDER', 'minio');
  let storageProvider: StorageProvider;

  if (provider === 's3') {
    // Digital Ocean Spaces or AWS S3
    storageProvider = new S3Provider({
      provider: 's3',
      endpoint: getEnv('DO_SPACES_ENDPOINT'),
      region: getEnv('DO_SPACES_REGION'),
      bucket: getEnv('DO_SPACES_BUCKET'),
      credentials: {
        accessKeyId: getEnv('DO_SPACES_KEY'),
        secretAccessKey: getEnv('DO_SPACES_SECRET'),
      },
    });
  } else {
    // Minio (local development)
    storageProvider = new MinioProvider({
      provider: 'minio',
      endpoint: getEnv('MINIO_ENDPOINT', 'http://localhost:9000'),
      bucket: getEnv('MINIO_BUCKET', 'uploads'),
      credentials: {
        accessKeyId: getEnv('MINIO_ACCESS_KEY', 'minioadmin'),
        secretAccessKey: getEnv('MINIO_SECRET_KEY', 'minioadmin'),
      },
    });
  }

  // Register in DI container
  registerInstance(STORAGE_TOKENS.Provider, storageProvider);
  registerSingleton(STORAGE_TOKENS.StorageService, StorageService);

  console.log(`✅ Storage provider configured: ${provider}`);
}
```

### 4. Initialize in Application Entry Point

```typescript
// apps/your-app/src/index.ts
import 'reflect-metadata';
import { WebService, loadEnv } from '@atriz/core';
import { setupContainer } from './di';
import { setupStorage } from './di/setupStorage';

loadEnv();
setupContainer();
setupStorage(); // Initialize storage

const webService = new WebService({ /* ... */ });
// ... rest of setup
```

---

## Usage Patterns

### Pattern 1: Single File Upload

**Route Definition**:
```typescript
import { Router } from 'express';
import { uploadSingle, StorageService, STORAGE_TOKENS } from '@atriz/storage';
import { resolve } from '@atriz/core';
import { UploadImageController } from '../controllers';

const router = Router();
const storageService = resolve<StorageService>(STORAGE_TOKENS.StorageService);

router.post(
  '/upload',
  uploadSingle('image', {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    allowedExtensions: ['jpg', 'jpeg', 'png', 'webp'],
  }),
  (req, res) => {
    const controller = new UploadImageController(req, res, { storageService });
    return controller.handle();
  }
);
```

**Controller Implementation**:
```typescript
import { BaseController, ControllerRequest, ParamDefinition } from '@atriz/core';
import { StorageService } from '@atriz/storage';
import { Response } from 'express';

interface Services {
  storageService: StorageService;
}

export class UploadImageController extends BaseController<Services> {
  constructor(req: ControllerRequest, res: Response, services: Services) {
    super(req, res, services);
    this.requiresAuth = true;
  }

  protected defineParams(): ParamDefinition[] {
    return [
      { name: 'title', type: 'string', required: false, max: 100 },
      { name: 'description', type: 'string', required: false, max: 500 },
    ];
  }

  protected async execute(): Promise<any> {
    // Check if file was uploaded
    if (!this.hasFile()) {
      return this.error('No file provided', 400);
    }

    const file = this.getFile()!;
    const title = this.getParam<string>('title', '');
    const description = this.getParam<string>('description', '');

    // Upload to storage
    const result = await this.services!.storageService.uploadFile(file, {
      path: `uploads/${this.userId}`,
      acl: 'public-read',
      metadata: {
        uploadedBy: this.userId!,
        title,
        description,
      },
    });

    return this.created({
      file: {
        id: crypto.randomUUID(),
        url: result.url,
        key: result.key,
        size: result.size,
        contentType: result.contentType,
      },
    });
  }
}
```

### Pattern 2: Multiple File Upload

**Route Definition**:
```typescript
router.post(
  '/upload-multiple',
  uploadMultiple('images', 5, {
    maxFileSize: 5 * 1024 * 1024,
    maxFiles: 5,
    allowedMimeTypes: ['image/jpeg', 'image/png'],
  }),
  handler
);
```

**Controller Implementation**:
```typescript
export class UploadMultipleImagesController extends BaseController<Services> {
  protected async execute(): Promise<any> {
    if (!this.hasFiles()) {
      return this.error('No files provided', 400);
    }

    const files = this.getFiles();

    if (files.length > 5) {
      return this.error('Maximum 5 images allowed', 400);
    }

    // Upload all files
    const results = await this.services!.storageService.uploadFiles(files, {
      path: 'gallery',
      acl: 'public-read',
    });

    return this.created({
      images: results.map(r => ({
        url: r.url,
        key: r.key,
        size: r.size,
      })),
    });
  }
}
```

### Pattern 3: File Deletion

```typescript
export class DeleteFileController extends BaseController<Services> {
  protected defineParams(): ParamDefinition[] {
    return [
      { name: 'fileKey', type: 'string', required: true },
    ];
  }

  protected async execute(): Promise<any> {
    const fileKey = this.getParam<string>('fileKey');

    // Verify ownership/permissions first
    // ... your ownership check logic ...

    const deleted = await this.services!.storageService.deleteFile(fileKey);

    if (!deleted) {
      return this.error('Failed to delete file', 500);
    }

    return this.success({ message: 'File deleted successfully' });
  }
}
```

### Pattern 4: Getting Signed URLs

```typescript
export class GetFileUrlController extends BaseController<Services> {
  protected async execute(): Promise<any> {
    const fileKey = this.getParam<string>('fileKey');

    // For temporary access (private files)
    const signedUrl = await this.services!.storageService.getSignedUrl(
      fileKey,
      3600 // expires in 1 hour
    );

    // For permanent access (public files)
    const publicUrl = this.services!.storageService.getPublicUrl(fileKey);

    return this.success({
      signedUrl,    // Temporary URL with expiration
      publicUrl,    // Permanent public URL
    });
  }
}
```

---

## BaseController File Helpers

The storage package enhances BaseController with file upload helpers:

```typescript
class BaseController {
  // Get single uploaded file
  protected getFile(fieldName?: string): Express.Multer.File | undefined
  
  // Get multiple uploaded files
  protected getFiles(fieldName?: string): Express.Multer.File[]
  
  // Check if file was uploaded
  protected hasFile(fieldName?: string): boolean
  
  // Check if files were uploaded
  protected hasFiles(fieldName?: string): boolean
}
```

**Usage Examples**:
```typescript
// Single file upload
if (this.hasFile()) {
  const file = this.getFile()!;
  // Process file
}

// Multiple files upload
if (this.hasFiles()) {
  const files = this.getFiles();
  // Process files
}

// File from specific field (when using uploadFields)
const avatar = this.getFile('avatar');
const photos = this.getFiles('photos');
```

---

## File Utilities

### Available Utilities

```typescript
import {
  generateUniqueFilename,
  getFileExtension,
  removeFileExtension,
  sanitizeFilename,
  formatBytes,
  isImage,
  isVideo,
  isDocument,
} from '@atriz/storage';

// Generate unique filename
const uniqueName = generateUniqueFilename('photo.jpg'); 
// => "1634567890-abc123def.jpg"

const uniqueWithPrefix = generateUniqueFilename('photo.jpg', 'avatar');
// => "avatar-1634567890-abc123def.jpg"

// Get file extension
const ext = getFileExtension('photo.jpg'); // => "jpg"

// Remove extension
const nameOnly = removeFileExtension('photo.jpg'); // => "photo"

// Sanitize filename for storage
const clean = sanitizeFilename('My Photo 2024!.jpg'); 
// => "my-photo-2024.jpg"

// Format bytes to human-readable
const readable = formatBytes(1024 * 1024); // => "1 MB"
const precise = formatBytes(1536, 2); // => "1.5 KB"

// Check MIME types
const isImg = isImage('image/jpeg'); // => true
const isVid = isVideo('video/mp4'); // => true
const isDoc = isDocument('application/pdf'); // => true
```

---

## Types Reference

### StorageConfig

```typescript
interface StorageConfig {
  provider: 's3' | 'minio';
  endpoint?: string;
  region?: string;
  bucket: string;
  credentials: {
    accessKeyId: string;
    secretAccessKey: string;
  };
  forcePathStyle?: boolean;
}
```

### UploadOptions

```typescript
interface UploadOptions {
  bucket?: string;                        // Override default bucket
  path?: string;                          // File path/prefix in bucket
  acl?: 'private' | 'public-read' | 'public-read-write';
  contentType?: string;                   // Override content type
  metadata?: Record<string, string>;      // Custom metadata
  cacheControl?: string;                  // Cache-Control header
}
```

### UploadResult

```typescript
interface UploadResult {
  key: string;            // Storage key (path)
  url: string;            // Public or signed URL
  bucket: string;         // Bucket name
  size: number;           // File size in bytes
  contentType: string;    // MIME type
  etag?: string;          // ETag from S3
}
```

### FileValidationConfig

```typescript
interface FileValidationConfig {
  maxFileSize?: number;           // Maximum size in bytes
  maxFiles?: number;              // Maximum number of files
  allowedMimeTypes?: string[];    // Allowed MIME types
  allowedExtensions?: string[];   // Allowed extensions
  minFileSize?: number;           // Minimum size in bytes
}
```

---

## Common Use Cases

### 1. Product Images (E-commerce)

```typescript
// Upload product images with organized structure
const result = await storageService.uploadFile(file, {
  path: `products/${productId}/images`,
  acl: 'public-read',
  metadata: {
    productId,
    uploadedBy: this.userId!,
    isPrimary: isPrimary.toString(),
  },
});
```

### 2. User Avatars

```typescript
// Upload user avatar with user-specific path
const result = await storageService.uploadFile(file, {
  path: `users/${this.userId}/avatar`,
  acl: 'public-read',
  cacheControl: 'max-age=86400', // Cache for 1 day
});
```

### 3. Private Documents

```typescript
// Upload private document with restricted access
const result = await storageService.uploadFile(file, {
  path: `documents/${companyId}`,
  acl: 'private',
  metadata: {
    companyId,
    documentType: 'invoice',
    uploadedBy: this.userId!,
  },
});

// Later, generate signed URL for temporary access
const signedUrl = await storageService.getSignedUrl(
  result.key,
  3600 // 1 hour access
);
```

### 4. Multiple File Upload (Gallery)

```typescript
// Upload multiple images for a gallery
const files = this.getFiles();
const results = await storageService.uploadFiles(files, {
  path: `galleries/${galleryId}`,
  acl: 'public-read',
});

// Save to database
const images = results.map((r, index) => ({
  id: crypto.randomUUID(),
  galleryId,
  url: r.url,
  key: r.key,
  order: index,
}));
```

### 5. File Replacement

```typescript
// Replace old file with new one
async replaceFile(oldKey: string, newFile: Express.Multer.File) {
  // Upload new file
  const result = await storageService.uploadFile(newFile, options);
  
  // Delete old file
  await storageService.deleteFile(oldKey);
  
  return result;
}
```

---

## Testing

### Running Tests

```bash
cd packages/storage
pnpm test              # Run all tests
pnpm test:watch        # Watch mode
pnpm test:coverage     # With coverage report
```

### Test Coverage

- **FileValidator**: 11 tests (validation logic)
- **File Helpers**: 19 tests (utility functions)
- **StorageService**: 11 tests (service methods)
- **Total**: 41 passing tests

### Writing Tests for Controllers Using Storage

```typescript
import { describe, it, expect, vi } from 'vitest';
import { mockRequest, mockResponse } from '@atriz/core/testing';
import { UploadImageController } from '../UploadImageController';

describe('UploadImageController', () => {
  it('should upload file successfully', async () => {
    // Mock storage service
    const mockStorageService = {
      uploadFile: vi.fn().mockResolvedValue({
        key: 'test-key.jpg',
        url: 'https://example.com/test-key.jpg',
        bucket: 'test',
        size: 1024,
        contentType: 'image/jpeg',
      }),
    };

    // Create mock file
    const req = mockRequest({
      body: { title: 'Test Image' },
      file: {
        fieldname: 'image',
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
        buffer: Buffer.from('test'),
      } as any,
    });

    const res = mockResponse();

    const controller = new UploadImageController(
      req,
      res,
      { storageService: mockStorageService as any }
    );

    await controller.handle();

    expect(mockStorageService.uploadFile).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
  });
});
```

---

## Local Development with Minio

### Setup Minio with Docker

```bash
# Start Minio server
docker run -p 9000:9000 -p 9001:9001 \
  -e "MINIO_ROOT_USER=minioadmin" \
  -e "MINIO_ROOT_PASSWORD=minioadmin" \
  minio/minio server /data --console-address ":9001"

# Access Minio Console
open http://localhost:9001
```

### Minio Configuration

```bash
# .env
STORAGE_PROVIDER=minio
MINIO_ENDPOINT=http://localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=uploads
```

---

## Production Deployment

### Digital Ocean Spaces Setup

1. **Create Spaces Bucket**:
   - Log in to Digital Ocean
   - Navigate to Spaces
   - Create new Space
   - Choose region

2. **Generate API Keys**:
   - Navigate to API → Spaces Keys
   - Generate new key pair
   - Save access key and secret

3. **Configure Environment**:
```bash
STORAGE_PROVIDER=s3
DO_SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com
DO_SPACES_REGION=nyc3
DO_SPACES_KEY=your-access-key
DO_SPACES_SECRET=your-secret-key
DO_SPACES_BUCKET=your-bucket-name
```

4. **CORS Configuration** (if needed for direct browser uploads):
```json
[
  {
    "AllowedOrigins": ["https://yourdomain.com"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3000
  }
]
```

---

## Security Best Practices

### 1. File Validation

Always validate files before uploading:

```typescript
// In middleware configuration
uploadSingle('file', {
  maxFileSize: 5 * 1024 * 1024,
  allowedMimeTypes: ['image/jpeg', 'image/png'],
  allowedExtensions: ['jpg', 'jpeg', 'png'],
})
```

### 2. Access Control

Use appropriate ACL settings:

```typescript
// Public files (images, assets)
{ acl: 'public-read' }

// Private files (documents, invoices)
{ acl: 'private' }

// Use signed URLs for temporary access to private files
const signedUrl = await storageService.getSignedUrl(key, 3600);
```

### 3. File Ownership Verification

Always verify ownership before operations:

```typescript
protected async execute(): Promise<any> {
  const fileKey = this.getParam<string>('fileKey');
  
  // Check ownership
  const file = await db.files.findByKey(fileKey);
  if (file.uploadedBy !== this.userId) {
    return this.forbidden('You do not own this file');
  }
  
  // Proceed with deletion
  await storageService.deleteFile(fileKey);
}
```

### 4. Signed URL Expiration

Use short expiration times for sensitive files:

```typescript
// Short-lived for sensitive documents
const url = await storageService.getSignedUrl(key, 900); // 15 minutes

// Longer for previews
const url = await storageService.getSignedUrl(key, 3600); // 1 hour
```

---

## Troubleshooting

### Issue: "Cannot connect to Minio"

**Solution**:
- Ensure Minio is running: `docker ps`
- Check endpoint URL is correct
- Verify port 9000 is accessible

### Issue: "Access Denied" on upload

**Solution**:
- Check credentials are correct
- Verify bucket exists
- Check ACL permissions
- For Minio, ensure bucket was created

### Issue: "File too large"

**Solution**:
- Increase `maxFileSize` in middleware config
- Check server/proxy upload limits (nginx, etc.)

### Issue: "Invalid MIME type"

**Solution**:
- Add MIME type to `allowedMimeTypes` array
- Check file is actually the claimed type
- Use `file.mimetype` to debug actual MIME type

---

## Migration from Other Storage Solutions

### From Direct S3 SDK Usage

**Before**:
```typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({ /* config */ });
await s3.send(new PutObjectCommand({ /* params */ }));
```

**After**:
```typescript
const result = await storageService.uploadFile(file, {
  path: 'uploads',
  acl: 'public-read',
});
```

### From Multer Disk Storage

**Before**:
```typescript
const upload = multer({ dest: 'uploads/' });
// Files stored on local disk
```

**After**:
```typescript
import { uploadSingle } from '@atriz/storage';

// Files stored in cloud (S3/Minio)
uploadSingle('file', { maxFileSize: 5 * 1024 * 1024 })
```

---

## Quick Reference

### Imports

```typescript
// Services
import { StorageService, FileValidator } from '@atriz/storage';

// Providers
import { S3Provider, MinioProvider } from '@atriz/storage';

// Middleware
import { uploadSingle, uploadMultiple, uploadFields } from '@atriz/storage';

// Types
import { UploadResult, UploadOptions, StorageConfig } from '@atriz/storage';

// DI Tokens
import { STORAGE_TOKENS } from '@atriz/storage';

// Utilities
import { generateUniqueFilename, formatBytes, isImage } from '@atriz/storage';
```

### DI Tokens

```typescript
STORAGE_TOKENS.Provider       // StorageProvider instance
STORAGE_TOKENS.StorageService // StorageService class
```

### Environment Variables Checklist

```bash
✅ STORAGE_PROVIDER (minio or s3)

# Minio
✅ MINIO_ENDPOINT
✅ MINIO_ACCESS_KEY
✅ MINIO_SECRET_KEY
✅ MINIO_BUCKET

# Digital Ocean Spaces
✅ DO_SPACES_ENDPOINT
✅ DO_SPACES_REGION
✅ DO_SPACES_KEY
✅ DO_SPACES_SECRET
✅ DO_SPACES_BUCKET
```

---

## Package Dependencies

### Production Dependencies
- `@aws-sdk/client-s3`: S3 client
- `@aws-sdk/s3-request-presigner`: Generate signed URLs
- `minio`: Minio client for local development
- `multer`: File upload middleware
- `mime-types`: MIME type detection
- `tsyringe`: Dependency injection
- `reflect-metadata`: DI metadata support

### Dev Dependencies
- `@types/express`: Express type definitions
- `@types/multer`: Multer type definitions
- `vitest`: Testing framework
- `typescript`: TypeScript compiler

---

## Support & Resources

### Documentation
- README.md - Quick start guide
- CHANGELOG.md - Version history
- This file - Complete reference for AI agents

### Example Implementation
- `apps/pshop/src/controllers/ProductImageController.ts`
- `apps/pshop/src/routes/productImages.routes.ts`
- `apps/pshop/src/di/setupStorage.ts`

### External Resources
- [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/)
- [Minio Documentation](https://min.io/docs/minio/linux/index.html)
- [Digital Ocean Spaces](https://docs.digitalocean.com/products/spaces/)
- [Multer Documentation](https://github.com/expressjs/multer)

---

**Last Updated**: 2025-10-21  
**Package Version**: 0.1.0  
**Status**: Production Ready ✅

