import { describe, it, expect } from 'vitest';
import { FileValidator } from '../services/FileValidator';

describe('FileValidator', () => {
    const createMockFile = (overrides: Partial<Express.Multer.File> = {}): Express.Multer.File => ({
        fieldname: 'file',
        originalname: 'test.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 1024 * 1024, // 1MB
        buffer: Buffer.from(''),
        stream: null as any,
        destination: '',
        filename: 'test.jpg',
        path: '',
        ...overrides,
    });

    describe('validateFile', () => {
        it('should validate a file successfully with no restrictions', () => {
            const file = createMockFile();
            const result = FileValidator.validateFile(file);

            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should reject file exceeding max size', () => {
            const file = createMockFile({ size: 6 * 1024 * 1024 }); // 6MB
            const result = FileValidator.validateFile(file, {
                maxFileSize: 5 * 1024 * 1024, // 5MB
            });

            expect(result.valid).toBe(false);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0]).toContain('exceeds maximum');
        });

        it('should reject file below min size', () => {
            const file = createMockFile({ size: 500 }); // 500 bytes
            const result = FileValidator.validateFile(file, {
                minFileSize: 1024, // 1KB
            });

            expect(result.valid).toBe(false);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0]).toContain('below minimum');
        });

        it('should reject file with disallowed MIME type', () => {
            const file = createMockFile({ mimetype: 'application/pdf' });
            const result = FileValidator.validateFile(file, {
                allowedMimeTypes: ['image/jpeg', 'image/png'],
            });

            expect(result.valid).toBe(false);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0]).toContain('not allowed');
        });

        it('should accept file with allowed MIME type', () => {
            const file = createMockFile({ mimetype: 'image/jpeg' });
            const result = FileValidator.validateFile(file, {
                allowedMimeTypes: ['image/jpeg', 'image/png'],
            });

            expect(result.valid).toBe(true);
        });

        it('should reject file with disallowed extension', () => {
            const file = createMockFile({ originalname: 'test.exe' });
            const result = FileValidator.validateFile(file, {
                allowedExtensions: ['jpg', 'png', 'pdf'],
            });

            expect(result.valid).toBe(false);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0]).toContain('extension');
        });

        it('should accept file with allowed extension', () => {
            const file = createMockFile({ originalname: 'test.jpg' });
            const result = FileValidator.validateFile(file, {
                allowedExtensions: ['jpg', 'png', 'pdf'],
            });

            expect(result.valid).toBe(true);
        });

        it('should handle multiple validation errors', () => {
            const file = createMockFile({
                size: 10 * 1024 * 1024,
                mimetype: 'application/pdf',
                originalname: 'test.pdf',
            });
            const result = FileValidator.validateFile(file, {
                maxFileSize: 5 * 1024 * 1024,
                allowedMimeTypes: ['image/jpeg', 'image/png'],
                allowedExtensions: ['jpg', 'png'],
            });

            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(1);
        });
    });

    describe('validateFiles', () => {
        it('should validate multiple files successfully', () => {
            const files = [
                createMockFile({ originalname: 'test1.jpg' }),
                createMockFile({ originalname: 'test2.jpg' }),
            ];
            const result = FileValidator.validateFiles(files);

            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should reject when exceeding max file count', () => {
            const files = [createMockFile(), createMockFile(), createMockFile()];
            const result = FileValidator.validateFiles(files, {
                maxFiles: 2,
            });

            expect(result.valid).toBe(false);
            expect(result.errors[0]).toContain('Too many files');
        });

        it('should validate each file individually', () => {
            const files = [
                createMockFile({ originalname: 'test1.jpg', mimetype: 'image/jpeg' }),
                createMockFile({ originalname: 'test2.pdf', mimetype: 'application/pdf' }),
            ];
            const result = FileValidator.validateFiles(files, {
                allowedMimeTypes: ['image/jpeg', 'image/png'],
            });

            expect(result.valid).toBe(false);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0]).toContain('File 2');
        });
    });
});
