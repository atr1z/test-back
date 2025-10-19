export type ParamType =
    | 'string'
    | 'number'
    | 'boolean'
    | 'email'
    | 'password'
    | 'phone'
    | 'date'
    | 'object'
    | 'array'
    | 'file'
    | 'url'
    | 'uuid';

export interface ParamDefinition {
    name: string;
    type: ParamType;
    required?: boolean;
    canBeEmpty?: boolean;
    min?: number;
    max?: number;
    pattern?: RegExp;
    custom?: (value: any) => boolean | Promise<boolean>;
    errorMessage?: string;
}

export interface ValidationResult {
    valid: boolean;
    message: string;
    field?: string;
}

export interface ValidatedParams<T = any> {
    [key: string]: T;
}
