import { describe, it, expect } from 'vitest';

describe('Mextrack API', () => {
    it('should have basic test', () => {
        expect(true).toBe(true);
    });

    it('should define application name', () => {
        const appName = '@atriz/mextrack-api';
        expect(appName).toBeDefined();
    });
});
