# @atriz/storage

## 0.1.0 (2025-10-21)

### Features

- **Storage Package**: Complete file upload and storage management package
- **S3Provider**: AWS S3 and Digital Ocean Spaces support
- **MinioProvider**: Minio support for local development and self-hosted storage
- **StorageService**: Main service with DI integration
- **Upload Middleware**: Multer-based middleware with validation
- **File Validation**: MIME type, size, and extension validation
- **File Helpers**: Utility functions for file operations
- **Type Safety**: Full TypeScript support with comprehensive types
- **Testing**: 41 passing tests with high coverage
- **Documentation**: Comprehensive README with examples

### Providers

- **S3Provider**: S3-compatible storage (AWS S3, Digital Ocean Spaces)
  - File upload (single and multiple)
  - File deletion (single and multiple)
  - Signed URLs for temporary access
  - Public URLs
  - File metadata retrieval
  - Exists check

- **MinioProvider**: Minio storage support
  - All S3Provider features
  - Automatic bucket creation
  - Local development friendly

### Services

- **StorageService**: Main abstraction over storage providers
  - Injectable via TSyringe
  - Provider-agnostic API
  - Simple, clean interface

- **FileValidator**: File validation utilities
  - File size validation (min/max)
  - MIME type validation
  - File extension validation
  - Multiple file validation
  - Human-readable error messages

### Middleware

- **uploadSingle**: Upload single file
- **uploadMultiple**: Upload multiple files from one field
- **uploadFields**: Upload files from multiple fields
- **uploadAny**: Accept any files
- Configurable limits and validation

### Utilities

- **File Helpers**:
  - Generate unique filenames
  - Get/remove file extensions
  - Sanitize filenames
  - Format bytes to human-readable
  - MIME type helpers (isImage, isVideo, isDocument)

### Integration

- **BaseController Enhancement**: Added file upload helpers
  - `getFile()`: Get single uploaded file
  - `getFiles()`: Get multiple uploaded files
  - `hasFile()`: Check if file exists
  - `hasFiles()`: Check if files exist

### Example Implementation

- Complete example in `apps/pshop` demonstrating:
  - Single file upload
  - Multiple file upload
  - File deletion
  - Storage provider configuration
  - Environment-based provider selection

### Dependencies

- `@aws-sdk/client-s3`: ^3.478.0
- `@aws-sdk/s3-request-presigner`: ^3.478.0
- `minio`: ^7.1.3
- `multer`: ^1.4.5-lts.1
- `mime-types`: ^2.1.35
- `tsyringe`: ^4.8.0
- `reflect-metadata`: ^0.1.13

