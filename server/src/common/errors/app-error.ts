export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string, code = 'BAD_REQUEST') { super(400, code, message); }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized', code = 'UNAUTHORIZED') { super(401, code, message); }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden', code = 'FORBIDDEN') { super(403, code, message); }
}

export class NotFoundError extends AppError {
  constructor(message: string, code = 'NOT_FOUND') { super(404, code, message); }
}

export class ConflictError extends AppError {
  constructor(message: string, code = 'CONFLICT') { super(409, code, message); }
}

export class PaymentError extends AppError {
  constructor(message: string) { super(402, 'PAYMENT_DECLINED', message); }
}

export class ValidationError extends AppError {
  constructor(message: string) { super(400, 'VALIDATION_ERROR', message); }
}
