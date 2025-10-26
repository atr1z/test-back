import 'reflect-metadata';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StorageService } from '../services/StorageService';
import { StorageProvider } from '../providers/StorageProvider';
import { UploadResult } from '../types';

describe('StorageService', () => {
    let storageService: StorageService;
    let mockProvider: StorageProvider;

    const createMockFile = (overrides: Partial<Express.Multer.File> = {}): Express.Multer.File => ({
        fieldname: 'file',
        originalname: 'test.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 1024,
        buffer: Buffer.from('test'),
        stream: null as any,
        destination: '',
        filename: 'test.jpg',
        path: '',
        ...overrides,
    });

    const mockUploadResult: UploadResult = {
        key: 'test-key.jpg',
        url: 'https://example.com/test-key.jpg',
        bucket: 'test-bucket',
        size: 1024,
        contentType: 'image/jpeg',
        etag: 'test-etag',
    };

    beforeEach(() => {
        mockProvider = {
            upload: vi.fn().mockResolvedValue(mockUploadResult),
            uploadMultiple: vi.fn().mockResolvedValue([mockUploadResult]),
            delete: vi.fn().mockResolvedValue(true),
            deleteMultiple: vi.fn().mockResolvedValue([true]),
            getSignedUrl: vi.fn().mockResolvedValue('https://example.com/signed-url'),
            getPublicUrl: vi.fn().mockReturnValue('https://example.com/public-url'),
            exists: vi.fn().mockResolvedValue(true),
            getMetadata: vi.fn().mockResolvedValue({}),
        };

        storageService = new StorageService(mockProvider);
    });

    describe('uploadFile', () => {
        it('should upload a file using the provider', async () => {
            const file = createMockFile();
            const result = await storageService.uploadFile(file);

            expect(mockProvider.upload).toHaveBeenCalledWith(file, undefined);
            expect(result).toEqual(mockUploadResult);
        });

        it('should pass upload options to provider', async () => {
            const file = createMockFile();
            const options = { path: 'uploads', acl: 'public-read' as const };

            await storageService.uploadFile(file, options);

            expect(mockProvider.upload).toHaveBeenCalledWith(file, options);
        });
    });

    describe('uploadFiles', () => {
        it('should upload multiple files', async () => {
            const files = [createMockFile(), createMockFile()];
            const result = await storageService.uploadFiles(files);

            expect(mockProvider.uploadMultiple).toHaveBeenCalledWith(files, undefined);
            expect(result).toEqual([mockUploadResult]);
        });
    });

    describe('deleteFile', () => {
        it('should delete a file', async () => {
            const result = await storageService.deleteFile('test-key.jpg');

            expect(mockProvider.delete).toHaveBeenCalledWith('test-key.jpg', undefined);
            expect(result).toBe(true);
        });

        it('should delete a file from specific bucket', async () => {
            await storageService.deleteFile('test-key.jpg', 'custom-bucket');

            expect(mockProvider.delete).toHaveBeenCalledWith('test-key.jpg', 'custom-bucket');
        });
    });

    describe('deleteFiles', () => {
        it('should delete multiple files', async () => {
            const keys = ['file1.jpg', 'file2.jpg'];
            const result = await storageService.deleteFiles(keys);

            expect(mockProvider.deleteMultiple).toHaveBeenCalledWith(keys, undefined);
            expect(result).toEqual([true]);
        });
    });

    describe('getSignedUrl', () => {
        it('should get signed URL with default expiration', async () => {
            const url = await storageService.getSignedUrl('test-key.jpg');

            expect(mockProvider.getSignedUrl).toHaveBeenCalledWith('test-key.jpg', 3600, undefined);
            expect(url).toBe('https://example.com/signed-url');
        });

        it('should get signed URL with custom expiration', async () => {
            await storageService.getSignedUrl('test-key.jpg', 7200);

            expect(mockProvider.getSignedUrl).toHaveBeenCalledWith('test-key.jpg', 7200, undefined);
        });
    });

    describe('getPublicUrl', () => {
        it('should get public URL', () => {
            const url = storageService.getPublicUrl('test-key.jpg');

            expect(mockProvider.getPublicUrl).toHaveBeenCalledWith('test-key.jpg', undefined);
            expect(url).toBe('https://example.com/public-url');
        });
    });

    describe('fileExists', () => {
        it('should check if file exists', async () => {
            const exists = await storageService.fileExists('test-key.jpg');

            expect(mockProvider.exists).toHaveBeenCalledWith('test-key.jpg', undefined);
            expect(exists).toBe(true);
        });
    });

    describe('getFileMetadata', () => {
        it('should get file metadata', async () => {
            const metadata = await storageService.getFileMetadata('test-key.jpg');

            expect(mockProvider.getMetadata).toHaveBeenCalledWith('test-key.jpg', undefined);
            expect(metadata).toEqual({});
        });
    });
});
