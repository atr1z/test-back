export interface SuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

export interface ErrorResponse {
  success: false;
  error: string;
  details?: unknown;
}

export type ApiResponse<T = unknown> = SuccessResponse<T> | ErrorResponse;

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
