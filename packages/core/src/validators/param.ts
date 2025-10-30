import {
    ParamDefinition,
    ValidationResult,
    ParamType,
} from '../types/validation';
import { CommonValidators } from './common';

export class ParamValidator {
    /**
     * Validates a single parameter value against its definition
     */
    static async validateParam(
        paramName: string,
        value: any,
        definition: ParamDefinition
    ): Promise<ValidationResult> {
        // Check if required
        if (definition.required && (value === null || value === undefined)) {
            return {
                valid: false,
                message:
                    definition.errorMessage ||
                    `Parameter '${paramName}' is required`,
                field: paramName,
            };
        }

        // If not required and value is missing, skip validation
        if (!definition.required && (value === null || value === undefined)) {
            return { valid: true, message: '' };
        }

        // Check if can be empty
        if (!definition.canBeEmpty && value === '') {
            return {
                valid: false,
                message:
                    definition.errorMessage ||
                    `Parameter '${paramName}' cannot be empty`,
                field: paramName,
            };
        }

        // Type validation
        const typeValidation = this.validateType(
            paramName,
            value,
            definition.type
        );
        if (!typeValidation.valid) {
            return {
                ...typeValidation,
                message: definition.errorMessage || typeValidation.message,
                field: paramName,
            };
        }

        // Length/Range validation
        if (typeof value === 'string') {
            if (
                !CommonValidators.isValidLength(
                    value,
                    definition.min,
                    definition.max
                )
            ) {
                return {
                    valid: false,
                    message:
                        definition.errorMessage ||
                        `Parameter '${paramName}' length must be between ${definition.min || 0} and ${definition.max || 'unlimited'}`,
                    field: paramName,
                };
            }

            // SQL injection check for strings
            if (CommonValidators.hasSqlInjection(value)) {
                return {
                    valid: false,
                    message: 'Invalid input detected',
                    field: paramName,
                };
            }
        }

        if (typeof value === 'number') {
            if (
                !CommonValidators.isInRange(
                    value,
                    definition.min,
                    definition.max
                )
            ) {
                return {
                    valid: false,
                    message:
                        definition.errorMessage ||
                        `Parameter '${paramName}' must be between ${definition.min || 'any'} and ${definition.max || 'any'}`,
                    field: paramName,
                };
            }
        }

        // Pattern validation
        if (definition.pattern && typeof value === 'string') {
            if (!definition.pattern.test(value)) {
                return {
                    valid: false,
                    message:
                        definition.errorMessage ||
                        `Parameter '${paramName}' format is invalid`,
                    field: paramName,
                };
            }
        }

        // Custom validation
        if (definition.custom) {
            const customValid = await definition.custom(value);
            if (!customValid) {
                return {
                    valid: false,
                    message:
                        definition.errorMessage ||
                        `Parameter '${paramName}' failed custom validation`,
                    field: paramName,
                };
            }
        }

        return { valid: true, message: '' };
    }

    /**
     * Validates type of a parameter
     */
    private static validateType(
        paramName: string,
        value: any,
        type: ParamType
    ): ValidationResult {
        switch (type) {
            case 'string':
                return {
                    valid: typeof value === 'string',
                    message: `${paramName} must be a string`,
                };

            case 'number':
                return {
                    valid: typeof value === 'number' && !isNaN(value),
                    message: `${paramName} must be a number`,
                };

            case 'boolean':
                return {
                    valid:
                        typeof value === 'boolean' ||
                        (typeof value === 'string' &&
                            /^(true|false)$/i.test(value.trim())),
                    message: `${paramName} must be a boolean`,
                };

            case 'email':
                return {
                    valid:
                        typeof value === 'string' &&
                        CommonValidators.isValidEmail(value),
                    message: `${paramName} must be a valid email`,
                };

            case 'password':
                return {
                    valid:
                        typeof value === 'string' &&
                        CommonValidators.isValidPassword(value),
                    message: `${paramName} must be a valid password (min 8 chars, uppercase, lowercase, number, special char)`,
                };

            case 'phone':
                return {
                    valid:
                        typeof value === 'string' &&
                        CommonValidators.isValidPhone(value),
                    message: `${paramName} must be a valid phone number`,
                };

            case 'date':
                return {
                    valid: CommonValidators.isValidDate(value),
                    message: `${paramName} must be a valid date`,
                };

            case 'url':
                return {
                    valid:
                        typeof value === 'string' &&
                        CommonValidators.isValidUrl(value),
                    message: `${paramName} must be a valid URL`,
                };

            case 'uuid':
                return {
                    valid:
                        typeof value === 'string' &&
                        CommonValidators.isValidUuid(value),
                    message: `${paramName} must be a valid UUID`,
                };

            case 'object':
                return {
                    valid:
                        typeof value === 'object' &&
                        value !== null &&
                        !Array.isArray(value),
                    message: `${paramName} must be an object`,
                };

            case 'array':
                return {
                    valid: Array.isArray(value),
                    message: `${paramName} must be an array`,
                };

            case 'file':
                return { valid: true, message: '' };

            default:
                return {
                    valid: false,
                    message: `${paramName} has an invalid type definition`,
                };
        }
    }

    /**
     * Validates multiple parameters at once
     */
    static async validateParams(
        params: Record<string, any>,
        definitions: ParamDefinition[]
    ): Promise<ValidationResult[]> {
        const results: ValidationResult[] = [];

        for (const definition of definitions) {
            const value = params[definition.name];
            const result = await this.validateParam(
                definition.name,
                value,
                definition
            );
            if (!result.valid) {
                results.push(result);
            }
        }

        return results;
    }
}
