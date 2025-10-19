import { Response } from 'express';

export interface MockResponse {
    statusCode: number;
    body: any;
    headers: Record<string, string>;
}

/**
 * Create a mock Express response for testing
 */
export function createMockResponse(): Response & {
    _getMockResponse: () => MockResponse;
    _reset: () => void;
} {
    const mockResponse: MockResponse = {
        statusCode: 200,
        body: null,
        headers: {},
    };

    const response = {
        status: function (code: number) {
            mockResponse.statusCode = code;
            return this;
        },
        json: function (data: any) {
            mockResponse.body = data;
            return this;
        },
        send: function (data: any) {
            mockResponse.body = data;
            return this;
        },
        setHeader: function (name: string, value: string) {
            mockResponse.headers[name] = value;
            return this;
        },
        getHeader: function (name: string) {
            return mockResponse.headers[name];
        },
        _getMockResponse: () => mockResponse,
        _reset: () => {
            mockResponse.statusCode = 200;
            mockResponse.body = null;
            mockResponse.headers = {};
        },
    } as any;

    return response;
}
