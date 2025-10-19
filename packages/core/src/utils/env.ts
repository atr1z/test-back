import { config } from 'dotenv';

/**
 * Load environment variables from .env file
 */
export const loadEnv = (): void => {
    config();
};

/**
 * Get environment variable with type safety
 */
export const getEnv = (key: string, defaultValue?: string): string => {
    const value = process.env[key];

    if (!value && !defaultValue) {
        throw new Error(`Environment variable ${key} is not set`);
    }

    return value || defaultValue || '';
};

/**
 * Get environment variable as number
 */
export const getEnvAsNumber = (key: string, defaultValue?: number): number => {
    const value = getEnv(key, defaultValue?.toString());
    const parsed = parseInt(value, 10);

    if (isNaN(parsed)) {
        throw new Error(`Environment variable ${key} is not a valid number`);
    }

    return parsed;
};

/**
 * Get environment variable as boolean
 */
export const getEnvAsBoolean = (key: string, defaultValue?: boolean): boolean => {
    const value = getEnv(key, defaultValue?.toString());
    return value === 'true' || value === '1';
};
