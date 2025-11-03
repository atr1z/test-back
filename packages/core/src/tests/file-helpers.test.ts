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
} from '../utils/file-helpers';

describe('file-helpers', () => {
    describe('generateUniqueFilename', () => {
        it('should generate unique filename with extension', () => {
            const originalName = 'test.jpg';
            const filename = generateUniqueFilename(originalName);

            expect(filename).toMatch(/^\d+-[a-z0-9]+\.jpg$/);
            expect(filename).toContain('.jpg');
        });

        it('should generate unique filename with prefix', () => {
            const originalName = 'document.pdf';
            const prefix = 'user-123';
            const filename = generateUniqueFilename(originalName, prefix);

            expect(filename).toMatch(/^user-123-\d+-[a-z0-9]+\.pdf$/);
            expect(filename).toContain('user-123-');
        });

        it('should generate different filenames for same input', () => {
            const originalName = 'test.txt';
            const filename1 = generateUniqueFilename(originalName);
            const filename2 = generateUniqueFilename(originalName);

            expect(filename1).not.toBe(filename2);
        });

        it('should handle filename without extension', () => {
            const originalName = 'README';
            const filename = generateUniqueFilename(originalName);

            expect(filename).toMatch(/^\d+-[a-z0-9]+$/);
        });

        it('should handle filename with multiple dots', () => {
            const originalName = 'file.backup.tar.gz';
            const filename = generateUniqueFilename(originalName);

            expect(filename).toMatch(/^\d+-[a-z0-9]+\.gz$/);
        });
    });

    describe('getFileExtension', () => {
        it('should return file extension in lowercase', () => {
            expect(getFileExtension('test.JPG')).toBe('jpg');
            expect(getFileExtension('document.PDF')).toBe('pdf');
            expect(getFileExtension('file.txt')).toBe('txt');
        });

        it('should return empty string for filename without extension', () => {
            expect(getFileExtension('README')).toBe('');
            expect(getFileExtension('file')).toBe('');
        });

        it('should return last extension for multiple dots', () => {
            expect(getFileExtension('file.backup.tar.gz')).toBe('gz');
            expect(getFileExtension('archive.zip.backup')).toBe('backup');
        });

        it('should handle empty string', () => {
            expect(getFileExtension('')).toBe('');
        });
    });

    describe('removeFileExtension', () => {
        it('should remove file extension', () => {
            expect(removeFileExtension('test.jpg')).toBe('test');
            expect(removeFileExtension('document.pdf')).toBe('document');
            expect(removeFileExtension('file.txt')).toBe('file');
        });

        it('should return original filename if no extension', () => {
            expect(removeFileExtension('README')).toBe('README');
            expect(removeFileExtension('file')).toBe('file');
        });

        it('should remove only last extension', () => {
            expect(removeFileExtension('file.backup.tar.gz')).toBe(
                'file.backup.tar'
            );
        });

        it('should handle empty string', () => {
            expect(removeFileExtension('')).toBe('');
        });
    });

    describe('sanitizeFilename', () => {
        it('should convert to lowercase', () => {
            expect(sanitizeFilename('TEST.JPG')).toBe('test.jpg');
        });

        it('should replace spaces with hyphens', () => {
            expect(sanitizeFilename('my file name.jpg')).toBe(
                'my-file-name.jpg'
            );
            expect(
                sanitizeFilename('file  with   multiple    spaces.pdf')
            ).toBe('file-with-multiple-spaces.pdf');
        });

        it('should remove special characters', () => {
            expect(sanitizeFilename('file@#$%^&*().jpg')).toBe('file.jpg');
            expect(sanitizeFilename('file[with]brackets.pdf')).toBe(
                'filewithbrackets.pdf'
            );
        });

        it('should keep allowed characters', () => {
            expect(sanitizeFilename('file-name_123.jpg')).toBe(
                'file-name_123.jpg'
            );
        });

        it('should handle empty string', () => {
            expect(sanitizeFilename('')).toBe('');
        });
    });

    describe('formatBytes', () => {
        it('should format bytes correctly', () => {
            expect(formatBytes(0)).toBe('0 Bytes');
            expect(formatBytes(1024)).toBe('1 KB');
            expect(formatBytes(1024 * 1024)).toBe('1 MB');
            expect(formatBytes(1024 * 1024 * 1024)).toBe('1 GB');
        });

        it('should handle decimal places', () => {
            expect(formatBytes(1536, 0)).toBe('2 KB');
            expect(formatBytes(1536, 1)).toBe('1.5 KB');
            expect(formatBytes(1536, 2)).toBe('1.5 KB');
        });

        it('should handle large numbers', () => {
            expect(formatBytes(1024 * 1024 * 1024 * 1024)).toBe('1 TB');
        });

        it('should handle negative decimals', () => {
            expect(formatBytes(1536, -1)).toBe('2 KB');
        });
    });

    describe('isImage', () => {
        it('should return true for image mimetypes', () => {
            expect(isImage('image/jpeg')).toBe(true);
            expect(isImage('image/png')).toBe(true);
            expect(isImage('image/gif')).toBe(true);
            expect(isImage('image/webp')).toBe(true);
        });

        it('should return false for non-image mimetypes', () => {
            expect(isImage('text/plain')).toBe(false);
            expect(isImage('application/pdf')).toBe(false);
            expect(isImage('video/mp4')).toBe(false);
        });

        it('should handle empty string', () => {
            expect(isImage('')).toBe(false);
        });
    });

    describe('isVideo', () => {
        it('should return true for video mimetypes', () => {
            expect(isVideo('video/mp4')).toBe(true);
            expect(isVideo('video/avi')).toBe(true);
            expect(isVideo('video/quicktime')).toBe(true);
            expect(isVideo('video/webm')).toBe(true);
        });

        it('should return false for non-video mimetypes', () => {
            expect(isVideo('image/jpeg')).toBe(false);
            expect(isVideo('text/plain')).toBe(false);
            expect(isVideo('application/pdf')).toBe(false);
        });

        it('should handle empty string', () => {
            expect(isVideo('')).toBe(false);
        });
    });

    describe('isDocument', () => {
        it('should return true for document mimetypes', () => {
            expect(isDocument('application/pdf')).toBe(true);
            expect(isDocument('application/msword')).toBe(true);
            expect(
                isDocument(
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                )
            ).toBe(true);
            expect(isDocument('application/vnd.ms-excel')).toBe(true);
            expect(
                isDocument(
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                )
            ).toBe(true);
            expect(isDocument('text/plain')).toBe(true);
        });

        it('should return false for non-document mimetypes', () => {
            expect(isDocument('image/jpeg')).toBe(false);
            expect(isDocument('video/mp4')).toBe(false);
            expect(isDocument('audio/mp3')).toBe(false);
        });

        it('should handle empty string', () => {
            expect(isDocument('')).toBe(false);
        });
    });
});
