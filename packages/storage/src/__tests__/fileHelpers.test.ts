import { describe, it, expect } from 'vitest';
import {
    generateUniqueFilename,
    getFileExtension,
    removeFileExtension,
    sanitizeFilename,
    formatBytes,
    isImage,
    isVideo,
    isDocument,
} from '../utils/fileHelpers';

describe('File Helpers', () => {
    describe('generateUniqueFilename', () => {
        it('should generate unique filename with timestamp and random string', () => {
            const filename1 = generateUniqueFilename('test.jpg');
            const filename2 = generateUniqueFilename('test.jpg');

            expect(filename1).not.toBe(filename2);
            expect(filename1).toMatch(/^\d+-[a-z0-9]+\.jpg$/);
        });

        it('should include prefix when provided', () => {
            const filename = generateUniqueFilename('test.jpg', 'avatar');
            expect(filename).toMatch(/^avatar-\d+-[a-z0-9]+\.jpg$/);
        });
    });

    describe('getFileExtension', () => {
        it('should extract file extension', () => {
            expect(getFileExtension('test.jpg')).toBe('jpg');
            expect(getFileExtension('document.pdf')).toBe('pdf');
            expect(getFileExtension('archive.tar.gz')).toBe('gz');
        });

        it('should return empty string for files without extension', () => {
            expect(getFileExtension('noextension')).toBe('');
        });

        it('should convert to lowercase', () => {
            expect(getFileExtension('TEST.JPG')).toBe('jpg');
        });
    });

    describe('removeFileExtension', () => {
        it('should remove file extension', () => {
            expect(removeFileExtension('test.jpg')).toBe('test');
            expect(removeFileExtension('my.file.pdf')).toBe('my.file');
        });

        it('should return original name if no extension', () => {
            expect(removeFileExtension('noextension')).toBe('noextension');
        });
    });

    describe('sanitizeFilename', () => {
        it('should convert to lowercase', () => {
            expect(sanitizeFilename('TEST.JPG')).toBe('test.jpg');
        });

        it('should replace spaces with hyphens', () => {
            expect(sanitizeFilename('my file name.jpg')).toBe('my-file-name.jpg');
        });

        it('should remove special characters', () => {
            expect(sanitizeFilename('file@#$%name.jpg')).toBe('filename.jpg');
        });

        it('should keep alphanumeric, hyphens, underscores, and dots', () => {
            expect(sanitizeFilename('my_file-123.v2.jpg')).toBe('my_file-123.v2.jpg');
        });
    });

    describe('formatBytes', () => {
        it('should format bytes correctly', () => {
            expect(formatBytes(0)).toBe('0 Bytes');
            expect(formatBytes(1024)).toBe('1 KB');
            expect(formatBytes(1024 * 1024)).toBe('1 MB');
            expect(formatBytes(1024 * 1024 * 1024)).toBe('1 GB');
            expect(formatBytes(1024 * 1024 * 1024 * 1024)).toBe('1 TB');
        });

        it('should handle decimals', () => {
            expect(formatBytes(1536, 2)).toBe('1.5 KB');
            expect(formatBytes(1024 * 1024 * 2.5, 1)).toBe('2.5 MB');
        });
    });

    describe('isImage', () => {
        it('should identify image MIME types', () => {
            expect(isImage('image/jpeg')).toBe(true);
            expect(isImage('image/png')).toBe(true);
            expect(isImage('image/gif')).toBe(true);
            expect(isImage('image/webp')).toBe(true);
        });

        it('should reject non-image MIME types', () => {
            expect(isImage('application/pdf')).toBe(false);
            expect(isImage('video/mp4')).toBe(false);
            expect(isImage('text/plain')).toBe(false);
        });
    });

    describe('isVideo', () => {
        it('should identify video MIME types', () => {
            expect(isVideo('video/mp4')).toBe(true);
            expect(isVideo('video/mpeg')).toBe(true);
            expect(isVideo('video/webm')).toBe(true);
        });

        it('should reject non-video MIME types', () => {
            expect(isVideo('image/jpeg')).toBe(false);
            expect(isVideo('application/pdf')).toBe(false);
        });
    });

    describe('isDocument', () => {
        it('should identify document MIME types', () => {
            expect(isDocument('application/pdf')).toBe(true);
            expect(isDocument('application/msword')).toBe(true);
            expect(isDocument('application/vnd.openxmlformats-officedocument.wordprocessingml.document')).toBe(true);
            expect(isDocument('text/plain')).toBe(true);
        });

        it('should reject non-document MIME types', () => {
            expect(isDocument('image/jpeg')).toBe(false);
            expect(isDocument('video/mp4')).toBe(false);
        });
    });
});

