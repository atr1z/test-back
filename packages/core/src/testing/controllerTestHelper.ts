import { BaseController } from '../controller';
import { createMockRequest, MockRequestOptions } from './mockRequest';
import { createMockResponse } from './mockResponse';
import { ControllerRequest, HttpStatus } from '../types';
import { Response } from 'express';

export interface ControllerTestResult {
    statusCode: number;
    body: any;
    headers: Record<string, string>;
}

/**
 * Test helper for controllers
 * Makes it easy to test BaseController implementations
 */
export class ControllerTestHelper {
    /**
     * Execute a controller and return the response
     */
    static async execute<T extends BaseController>(
        ControllerClass: new (
            req: ControllerRequest,
            res: Response,
            services?: any
        ) => T,
        requestOptions: MockRequestOptions = {},
        services?: any
    ): Promise<ControllerTestResult> {
        const req = createMockRequest(requestOptions);
        const res = createMockResponse();

        const controller = new ControllerClass(req, res, services);
        await controller.handle();

        const mockResponse = res._getMockResponse();
        return {
            statusCode: mockResponse.statusCode,
            body: mockResponse.body,
            headers: mockResponse.headers,
        };
    }

    /**
     * Assert that a response is successful (2xx status)
     */
    static assertSuccess(result: ControllerTestResult): void {
        if (result.statusCode < 200 || result.statusCode >= 300) {
            throw new Error(
                `Expected success status (2xx), got ${result.statusCode}: ${JSON.stringify(result.body)}`
            );
        }
    }

    /**
     * Assert that a response is an error (4xx or 5xx status)
     */
    static assertError(
        result: ControllerTestResult,
        expectedStatus?: HttpStatus
    ): void {
        if (result.statusCode < 400) {
            throw new Error(
                `Expected error status (4xx or 5xx), got ${result.statusCode}: ${JSON.stringify(result.body)}`
            );
        }

        if (
            expectedStatus !== undefined &&
            result.statusCode !== expectedStatus
        ) {
            throw new Error(
                `Expected status ${expectedStatus}, got ${result.statusCode}: ${JSON.stringify(result.body)}`
            );
        }
    }

    /**
     * Assert that a response has a specific status code
     */
    static assertStatus(
        result: ControllerTestResult,
        expectedStatus: HttpStatus
    ): void {
        if (result.statusCode !== expectedStatus) {
            throw new Error(
                `Expected status ${expectedStatus}, got ${result.statusCode}: ${JSON.stringify(result.body)}`
            );
        }
    }

    /**
     * Assert that response body contains expected data
     */
    static assertBodyContains(
        result: ControllerTestResult,
        expectedData: Partial<any>
    ): void {
        const body = result.body;

        for (const [key, value] of Object.entries(expectedData)) {
            if (JSON.stringify(body[key]) !== JSON.stringify(value)) {
                throw new Error(
                    `Expected body.${key} to be ${JSON.stringify(value)}, got ${JSON.stringify(body[key])}`
                );
            }
        }
    }
}

/**
 * Create a mock service for testing
 */
export function createMockService<T extends object>(
    implementation: Partial<T> = {}
): T & { _calls: Map<string, any[][]> } {
    const calls = new Map<string, any[][]>();

    const proxy = new Proxy(implementation as any, {
        get(target, prop) {
            if (prop === '_calls') return calls;

            if (typeof prop === 'string' && !(prop in target)) {
                // Create a mock function that tracks calls
                return (...args: any[]) => {
                    if (!calls.has(prop)) {
                        calls.set(prop, []);
                    }
                    calls.get(prop)!.push(args);
                    return undefined;
                };
            }

            const value = target[prop];
            if (typeof value === 'function') {
                return (...args: any[]) => {
                    if (!calls.has(prop as string)) {
                        calls.set(prop as string, []);
                    }
                    calls.get(prop as string)!.push(args);
                    return value.apply(target, args);
                };
            }

            return value;
        },
    });

    return proxy;
}
