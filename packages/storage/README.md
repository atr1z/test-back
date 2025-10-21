# @atriz/storage

File upload and cloud storage management package for Atriz Framework.

## Features

- 📦 **Multiple Storage Providers**: S3 (AWS, Digital Ocean Spaces) and Minio support
- 🔒 **Signed URLs**: Generate temporary URLs for private file access
- ✅ **File Validation**: MIME type, file size, and extension validation
- 🚀 **Easy Integration**: Works seamlessly with BaseController
- 🔧 **Dependency Injection**: Full TSyringe integration
- 📝 **TypeScript**: Full type safety

## Installation

```bash
pnpm add @atriz/storage
```

## Quick Start

### 1. Configure Storage Provider

```typescript
import { registerInstance } from '@atriz/core';
import { S3Provider, STORAGE_TOKENS } from '@atriz/storage';

// For Digital Ocean Spaces
const storageProvider = new S3Provider({
  provider: 's3',
  endpoint: process.env.DO_SPACES_ENDPOINT!,
  region: process.env.DO_SPACES_REGION!,
  bucket: process.env.DO_SPACES_BUCKET!,
  credentials: {
    accessKeyId: process.env.DO_SPACES_KEY!,
    secretAccessKey: process.env.DO_SPACES_SECRET!,
  },
});

registerInstance(STORAGE_TOKENS.Provider, storageProvider);
```

### 2. Use in Routes with Upload Middleware

```typescript
import { Router } from 'express';
import { uploadSingle } from '@atriz/storage';
import { UploadImageController } from '../controllers';

const router = Router();

router.post(
  '/upload',
  uploadSingle('image', {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    allowedExtensions: ['jpg', 'jpeg', 'png', 'webp'],
  }),
  (req, res) => {
    const controller = new UploadImageController(req, res, services);
    return controller.handle();
  }
);

export default router;
```

### 3. Handle Upload in Controller

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
      {
        name: 'title',
        type: 'string',
        required: false,
      },
    ];
  }

  protected async execute(): Promise<any> {
    if (!this.hasFile()) {
      return this.error('No file uploaded', 400);
    }

    const file = this.getFile()!;
    const title = this.getParam<string>('title', '');

    // Upload to storage
    const result = await this.services!.storageService.uploadFile(file, {
      path: `uploads/${this.userId}`,
      acl: 'public-read',
      metadata: {
        uploadedBy: this.userId!,
        title,
      },
    });

    return this.created({
      file: {
        url: result.url,
        key: result.key,
        size: result.size,
        contentType: result.contentType,
      },
    });
  }
}
```

## Storage Providers

### S3Provider (AWS S3, Digital Ocean Spaces)

```typescript
import { S3Provider } from '@atriz/storage';

const provider = new S3Provider({
  provider: 's3',
  endpoint: 'https://nyc3.digitaloceanspaces.com',
  region: 'nyc3',
  bucket: 'my-bucket',
  credentials: {
    accessKeyId: 'your-key',
    secretAccessKey: 'your-secret',
  },
});
```

### MinioProvider (Local Development)

```typescript
import { MinioProvider } from '@atriz/storage';

const provider = new MinioProvider({
  provider: 'minio',
  endpoint: 'http://localhost:9000',
  bucket: 'uploads',
  credentials: {
    accessKeyId: 'minioadmin',
    secretAccessKey: 'minioadmin',
  },
});
```

## Upload Middleware

### Single File Upload

```typescript
import { uploadSingle } from '@atriz/storage';

router.post('/upload', uploadSingle('file', {
  maxFileSize: 5 * 1024 * 1024,
  allowedMimeTypes: ['image/jpeg', 'image/png'],
}), handler);
```

### Multiple Files Upload

```typescript
import { uploadMultiple } from '@atriz/storage';

router.post('/upload-multiple', uploadMultiple('files', 5, {
  maxFileSize: 5 * 1024 * 1024,
  maxFiles: 5,
}), handler);
```

### Multiple Fields

```typescript
import { uploadFields } from '@atriz/storage';

router.post('/upload-mixed', uploadFields([
  { name: 'avatar', maxCount: 1 },
  { name: 'photos', maxCount: 5 },
]), handler);
```

## StorageService API

```typescript
// Upload file
const result = await storageService.uploadFile(file, {
  path: 'uploads/images',
  acl: 'public-read',
});

// Upload multiple files
const results = await storageService.uploadFiles(files, options);

// Delete file
await storageService.deleteFile(fileKey);

// Get signed URL (temporary access)
const url = await storageService.getSignedUrl(fileKey, 3600);

// Get public URL
const url = storageService.getPublicUrl(fileKey);

// Check if file exists
const exists = await storageService.fileExists(fileKey);

// Get file metadata
const metadata = await storageService.getFileMetadata(fileKey);
```

## Environment Variables

```bash
# Digital Ocean Spaces
STORAGE_PROVIDER=s3
DO_SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com
DO_SPACES_REGION=nyc3
DO_SPACES_KEY=your-access-key
DO_SPACES_SECRET=your-secret-key
DO_SPACES_BUCKET=your-bucket-name

# Minio (Local)
STORAGE_PROVIDER=minio
MINIO_ENDPOINT=http://localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=uploads
```

## File Helpers in BaseController

```typescript
// Check if file was uploaded
if (this.hasFile()) {
  const file = this.getFile();
}

// Get multiple files
if (this.hasFiles()) {
  const files = this.getFiles();
}

// Get files from specific field
const avatarFiles = this.getFiles('avatar');
```

## Utility Functions

```typescript
import { 
  generateUniqueFilename,
  sanitizeFilename,
  formatBytes,
  isImage,
  isVideo,
  isDocument,
} from '@atriz/storage';

const uniqueName = generateUniqueFilename('photo.jpg', 'avatar');
const clean = sanitizeFilename('My Photo 2024.jpg');
const readable = formatBytes(1024 * 1024); // "1 MB"
const isImg = isImage('image/jpeg'); // true
```

## License

MIT

