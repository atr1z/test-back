/**
 * File utility functions
 */

/**
 * Generate a unique filename
 */
export function generateUniqueFilename(originalName: string, prefix?: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const ext = originalName.split('.').pop();
    const prefixPart = prefix ? `${prefix}-` : '';

    return `${prefixPart}${timestamp}-${random}.${ext}`;
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
    const parts = filename.split('.');
    if (parts.length === 1) return '';
    return parts.pop()?.toLowerCase() || '';
}

/**
 * Remove file extension from filename
 */
export function removeFileExtension(filename: string): string {
    return filename.substring(0, filename.lastIndexOf('.')) || filename;
}

/**
 * Sanitize filename for storage
 */
export function sanitizeFilename(filename: string): string {
    return filename
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9\-_.]/g, '');
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number, decimals = 2): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Check if file is an image
 */
export function isImage(mimetype: string): boolean {
    return mimetype.startsWith('image/');
}

/**
 * Check if file is a video
 */
export function isVideo(mimetype: string): boolean {
    return mimetype.startsWith('video/');
}

/**
 * Check if file is a document
 */
export function isDocument(mimetype: string): boolean {
    const documentTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
    ];
    return documentTypes.includes(mimetype);
}
