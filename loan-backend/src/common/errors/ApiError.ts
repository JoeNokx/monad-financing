export type ApiErrorOptions = {
  statusCode: number;
  code?: string;
  details?: unknown;
};

export default class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code?: string;
  public readonly details?: unknown;
  public readonly isOperational: boolean;

  constructor(message: string, options: ApiErrorOptions) {
    super(message);

    this.name = 'ApiError';
    this.statusCode = options.statusCode;
    this.code = options.code;
    this.details = options.details;
    this.isOperational = true;
  }
}
