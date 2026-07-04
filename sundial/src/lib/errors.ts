export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class IntegrationError extends AppError {
  constructor(
    public service: string,
    message: string,
    public originalError?: unknown
  ) {
    super(message, `${service}_error`, 502);
    this.name = "IntegrationError";
  }
}

export class AuthorizationError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, "unauthorized", 403);
    this.name = "AuthorizationError";
  }
}

export class ValidationError extends AppError {
  constructor(
    message: string,
    public fields?: Record<string, string[]>
  ) {
    super(message, "validation_error", 400);
    this.name = "ValidationError";
  }
}
