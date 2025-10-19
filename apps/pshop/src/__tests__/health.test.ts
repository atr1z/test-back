import { describe, it, expect } from 'vitest';

describe('PShop API', () => {
    it('should have basic test', () => {
        expect(true).toBe(true);
    });

    it('should define application name', () => {
        const appName = '@atriz/pshop-api';
        expect(appName).toBeDefined();
    });
});
