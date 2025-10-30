import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from './async-handler';
import { RouteHandler } from '../types';

describe('asyncHandler', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockNext: NextFunction;

    beforeEach(() => {
        mockRequest = {};
        mockResponse = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis(),
            send: vi.fn().mockReturnThis(),
        };
        mockNext = vi.fn();
    });

    it('should call the handler function with correct parameters', async () => {
        const handler: RouteHandler = vi.fn().mockResolvedValue(undefined);
        const wrappedHandler = asyncHandler(handler);

        await wrappedHandler(
            mockRequest as Request,
            mockResponse as Response,
            mockNext
        );

        expect(handler).toHaveBeenCalledWith(
            mockRequest,
            mockResponse,
            mockNext
        );
    });

    it('should not call next when handler succeeds', async () => {
        const handler: RouteHandler = vi.fn().mockResolvedValue(undefined);
        const wrappedHandler = asyncHandler(handler);

        await wrappedHandler(
            mockRequest as Request,
            mockResponse as Response,
            mockNext
        );

        expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next with error when handler throws', async () => {
        const error = new Error('Test error');
        const handler: RouteHandler = vi.fn().mockRejectedValue(error);
        const wrappedHandler = asyncHandler(handler);

        await wrappedHandler(
            mockRequest as Request,
            mockResponse as Response,
            mockNext
        );

        expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should call next with error when handler returns rejected promise', async () => {
        const error = new Error('Promise rejected');
        const handler: RouteHandler = vi
            .fn()
            .mockReturnValue(Promise.reject(error));
        const wrappedHandler = asyncHandler(handler);

        await wrappedHandler(
            mockRequest as Request,
            mockResponse as Response,
            mockNext
        );

        expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should handle synchronous errors', async () => {
        const error = new Error('Sync error');
        const handler: RouteHandler = vi.fn().mockImplementation(() => {
            throw error;
        });
        const wrappedHandler = asyncHandler(handler);

        await wrappedHandler(
            mockRequest as Request,
            mockResponse as Response,
            mockNext
        );

        expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should handle non-Error objects thrown', async () => {
        const error = 'String error';
        const handler: RouteHandler = vi.fn().mockImplementation(() => {
            throw error;
        });
        const wrappedHandler = asyncHandler(handler);

        await wrappedHandler(
            mockRequest as Request,
            mockResponse as Response,
            mockNext
        );

        expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should handle null/undefined thrown', async () => {
        const handler: RouteHandler = vi.fn().mockImplementation(() => {
            throw null;
        });
        const wrappedHandler = asyncHandler(handler);

        await wrappedHandler(
            mockRequest as Request,
            mockResponse as Response,
            mockNext
        );

        expect(mockNext).toHaveBeenCalledWith(null);
    });

    it('should preserve this context in handler', async () => {
        const context = { value: 'test' };
        const handler: RouteHandler = function (this: any) {
            expect(this.value).toBe('test');
            return Promise.resolve();
        };
        const wrappedHandler = asyncHandler(handler);

        await wrappedHandler.call(
            context,
            mockRequest as Request,
            mockResponse as Response,
            mockNext
        );
    });

    it('should work with arrow functions', async () => {
        const handler: RouteHandler = (_req, _res, _next) => {
            return Promise.resolve();
        };
        const wrappedHandler = asyncHandler(handler);

        await wrappedHandler(
            mockRequest as Request,
            mockResponse as Response,
            mockNext
        );

        expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle handlers that return values', async () => {
        const returnValue = { success: true };
        const handler: RouteHandler = vi.fn().mockResolvedValue(returnValue);
        const wrappedHandler = asyncHandler(handler);

        const result = await wrappedHandler(
            mockRequest as Request,
            mockResponse as Response,
            mockNext
        );

        expect(result).toBe(returnValue);
        expect(mockNext).not.toHaveBeenCalled();
    });
});
