/**
 * Common validation functions
 */

export class CommonValidators {
    /**
     * Validates if an email is valid
     */
    static isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Validates if a password meets security requirements
     * At least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
     */
    static isValidPassword(password: string): boolean {
        const passwordRegex =
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*.])/;
        return password.length >= 8 && passwordRegex.test(password);
    }

    /**
     * Validates if a phone number is valid (10 digits)
     */
    static isValidPhone(phone: string): boolean {
        const phoneRegex = /^\d{10}$/;
        return phoneRegex.test(phone);
    }

    /**
     * Validates if a date is valid
     */
    static isValidDate(date: string | Date): boolean {
        try {
            const d = new Date(date);
            // Check if the date is valid and not NaN
            if (isNaN(d.getTime())) return false;

            // For string dates, check if the parsed date matches the input
            if (typeof date === 'string') {
                const parsedString = d.toISOString().split('T')[0];
                const inputString = date.split('T')[0];
                return parsedString === inputString;
            }

            return true;
        } catch {
            return false;
        }
    }

    /**
     * Validates if a URL is valid
     */
    static isValidUrl(url: string): boolean {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Validates if a UUID is valid
     */
    static isValidUuid(uuid: string): boolean {
        const uuidRegex =
            /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidRegex.test(uuid);
    }

    /**
     * Checks for potential SQL injection patterns
     */
    static hasSqlInjection(value: string): boolean {
        // Skip validation for JSON-like strings
        const trimmed = value.trim();
        if (trimmed.startsWith('{') || trimmed.startsWith('[')) return false;

        // Skip very long content (likely descriptions)
        if (value.length > 500) return false;

        const sqlPattern =
            /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|EXEC|UNION|GRANT|REVOKE|DECLARE|CAST)\b)/i;
        return sqlPattern.test(value);
    }

    /**
     * Sanitizes a string by removing potential XSS content
     */
    static sanitizeString(value: string): string {
        return value
            .replace(/[<>]/g, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+=/gi, '')
            .replace(/["']/g, ''); // Remove both single and double quotes
    }

    /**
     * Validates string length
     */
    static isValidLength(value: string, min?: number, max?: number): boolean {
        if (min !== undefined && value.length < min) return false;
        if (max !== undefined && value.length > max) return false;
        return true;
    }

    /**
     * Validates number range
     */
    static isInRange(value: number, min?: number, max?: number): boolean {
        if (min !== undefined && value < min) return false;
        if (max !== undefined && value > max) return false;
        return true;
    }
}
