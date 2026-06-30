export class AppError extends Error {
  public readonly statusCode: number
  public readonly code: string

  constructor(message: string, statusCode: number, code?: string) {
    super(message)
    this.statusCode = statusCode
    this.code = code ?? 'ERROR'
    this.name = 'AppError'
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, 'NOT_FOUND')
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED')
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403, 'FORBIDDEN')
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR')
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT')
  }
}

export function handleApiError(err: unknown) {
  if (err instanceof AppError) {
    return { error: err.message, status: err.statusCode, code: err.code }
  }
  console.error('[API Error]', err)
  return { error: 'Internal server error', status: 500, code: 'INTERNAL_ERROR' }
}
