import { ControllerRequest } from '../types';

export interface MockRequestOptions {
    body?: any;
    params?: Record<string, string>;
    query?: Record<string, any>;
    headers?: Record<string, string>;
    user?: {
        userId: number;
        roleId: number;
        [key: string]: any;
    };
    ip?: string;
    path?: string;
    method?: string;
}

/**
 * Create a mock Express request for testing
 */
export function createMockRequest(
    options: MockRequestOptions = {}
): ControllerRequest {
    const {
        body = {},
        params = {},
        query = {},
        headers = {},
        user,
        ip = '127.0.0.1',
        path = '/test',
        method = 'GET',
    } = options;

    return {
        body,
        params,
        query,
        headers,
        user,
        ip,
        path,
        method,
        get: (name: string) => headers[name.toLowerCase()],
        header: (name: string) => headers[name.toLowerCase()],
    } as ControllerRequest;
}
