import { FileValidationConfig, FileValidationResult } from '../types';

/**
 * File validation service
 */
export class FileValidator {
    /**
     * Validate a single file
     */
    static validateFile(
        file: Express.Multer.File,
        config: FileValidationConfig = {}
    ): FileValidationResult {
        const errors: string[] = [];

        // Check file size
        if (config.maxFileSize && file.size > config.maxFileSize) {
            errors.push(
                `File size (${this.formatBytes(file.size)}) exceeds maximum allowed (${this.formatBytes(config.maxFileSize)})`
            );
        }

        if (config.minFileSize && file.size < config.minFileSize) {
            errors.push(
                `File size (${this.formatBytes(file.size)}) is below minimum required (${this.formatBytes(config.minFileSize)})`
            );
        }

        // Check MIME type
        if (config.allowedMimeTypes?.length) {
            if (!config.allowedMimeTypes.includes(file.mimetype)) {
                errors.push(
                    `File type "${file.mimetype}" is not allowed. Allowed types: ${config.allowedMimeTypes.join(', ')}`
                );
            }
        }

        // Check file extension
        if (config.allowedExtensions?.length) {
            const ext = file.originalname.split('.').pop()?.toLowerCase();
            if (!ext || !config.allowedExtensions.includes(ext)) {
                errors.push(
                    `File extension ".${ext}" is not allowed. Allowed extensions: ${config.allowedExtensions.join(', ')}`
                );
            }
        }

        return {
            valid: errors.length === 0,
            errors,
        };
    }

    /**
     * Validate multiple files
     */
    static validateFiles(
        files: Express.Multer.File[],
        config: FileValidationConfig = {}
    ): FileValidationResult {
        const errors: string[] = [];

        // Check number of files
        if (config.maxFiles && files.length > config.maxFiles) {
            errors.push(`Too many files (${files.length}). Maximum allowed: ${config.maxFiles}`);
            return { valid: false, errors };
        }

        // Validate each file
        files.forEach((file, index) => {
            const result = this.validateFile(file, config);
            if (!result.valid) {
                errors.push(
                    `File ${index + 1} (${file.originalname}): ${result.errors.join(', ')}`
                );
            }
        });

        return {
            valid: errors.length === 0,
            errors,
        };
    }

    /**
     * Format bytes to human-readable string
     */
    private static formatBytes(bytes: number): string {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    }
}
