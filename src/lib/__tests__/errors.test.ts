import { describe, it, expect } from 'vitest'
import {
  AppError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ValidationError,
  ConflictError,
  handleApiError,
} from '../errors'

describe('AppError', () => {
  it('should create an error with statusCode and code', () => {
    const err = new AppError('test error', 400, 'TEST')
    expect(err.message).toBe('test error')
    expect(err.statusCode).toBe(400)
    expect(err.code).toBe('TEST')
    expect(err.name).toBe('AppError')
    expect(err instanceof Error).toBe(true)
  })
})

describe('NotFoundError', () => {
  it('should have 404 status', () => {
    const err = new NotFoundError('User')
    expect(err.message).toBe('User not found')
    expect(err.statusCode).toBe(404)
    expect(err.code).toBe('NOT_FOUND')
  })
})

describe('UnauthorizedError', () => {
  it('should have 401 status', () => {
    const err = new UnauthorizedError()
    expect(err.statusCode).toBe(401)
    expect(err.code).toBe('UNAUTHORIZED')
  })
})

describe('ForbiddenError', () => {
  it('should have 403 status', () => {
    const err = new ForbiddenError()
    expect(err.statusCode).toBe(403)
    expect(err.code).toBe('FORBIDDEN')
  })
})

describe('ValidationError', () => {
  it('should have 400 status', () => {
    const err = new ValidationError('bad input')
    expect(err.statusCode).toBe(400)
    expect(err.code).toBe('VALIDATION_ERROR')
  })
})

describe('ConflictError', () => {
  it('should have 409 status', () => {
    const err = new ConflictError('already exists')
    expect(err.statusCode).toBe(409)
    expect(err.code).toBe('CONFLICT')
  })
})

describe('handleApiError', () => {
  it('should handle AppError correctly', () => {
    const err = new AppError('test', 422, 'CUSTOM')
    const result = handleApiError(err)
    expect(result.error).toBe('test')
    expect(result.status).toBe(422)
    expect(result.code).toBe('CUSTOM')
  })

  it('should handle unknown errors', () => {
    const result = handleApiError(new Error('unexpected'))
    expect(result.error).toBe('Internal server error')
    expect(result.status).toBe(500)
    expect(result.code).toBe('INTERNAL_ERROR')
  })

  it('should handle non-Error values', () => {
    const result = handleApiError('string error')
    expect(result.error).toBe('Internal server error')
    expect(result.status).toBe(500)
  })
})
