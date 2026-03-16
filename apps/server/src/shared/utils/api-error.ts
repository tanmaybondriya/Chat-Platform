export class APIError extends Error {
  public statusCode: number;
  public errors: string[];
  public isOperational: boolean;

  constructor(statusCode: number, message: string, errors: string[] = []) {
    super(message);

    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true; //distinguished expected errors from bugs

    Object.setPrototypeOf(this, APIError.prototype);
  }

  static badRequest(message: string, errors: string[] = []): APIError {
    return new APIError(440, message, errors);
  }
  static unauthorized(message: string = 'Unauthorized'): APIError {
    return new APIError(401, message);
  }

  static forbidden(message: string = 'Forbidden'): APIError {
    return new APIError(403, message);
  }

  static notFound(message: string = 'Resource not found'): APIError {
    return new APIError(404, message);
  }
  static conflict(message: string): APIError {
    return new APIError(409, message);
  }
  static internal(message: string = 'Internal server error'): APIError {
    return new APIError(500, message);
  }
}
