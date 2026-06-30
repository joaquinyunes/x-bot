import { describe, it, expect } from 'vitest'
import { loginSchema, createAccountSchema, actionSchema, createCampaignSchema, seedSchema, createClientSchema } from '../validation/schemas'

describe('loginSchema', () => {
  it('should accept valid login data', () => {
    const result = loginSchema.safeParse({ email: 'test@example.com', password: '123456' })
    expect(result.success).toBe(true)
  })

  it('should reject invalid email', () => {
    const result = loginSchema.safeParse({ email: 'not-an-email', password: '123456' })
    expect(result.success).toBe(false)
  })

  it('should reject short password', () => {
    const result = loginSchema.safeParse({ email: 'test@example.com', password: '123' })
    expect(result.success).toBe(false)
  })
})

describe('createAccountSchema', () => {
  it('should accept valid userId', () => {
    const result = createAccountSchema.safeParse({ userId: 'abc123' })
    expect(result.success).toBe(true)
  })

  it('should reject empty userId', () => {
    const result = createAccountSchema.safeParse({ userId: '' })
    expect(result.success).toBe(false)
  })
})

describe('actionSchema', () => {
  it('should accept valid action', () => {
    const result = actionSchema.safeParse({ url: 'https://x.com/user/status/1', action: 'like' })
    expect(result.success).toBe(true)
  })

  it('should accept comment with text', () => {
    const result = actionSchema.safeParse({ url: 'https://x.com/user/status/1', action: 'comment', commentText: 'Nice!' })
    expect(result.success).toBe(true)
  })

  it('should reject invalid action', () => {
    const result = actionSchema.safeParse({ url: 'https://x.com/user/status/1', action: 'share' })
    expect(result.success).toBe(false)
  })

  it('should reject invalid url', () => {
    const result = actionSchema.safeParse({ url: 'not-a-url', action: 'like' })
    expect(result.success).toBe(false)
  })
})

describe('createCampaignSchema', () => {
  it('should accept valid campaign data', () => {
    const result = createCampaignSchema.safeParse({
      userId: 'user1',
      accountIds: ['acc1', 'acc2'],
      urls: ['https://x.com/user/status/1'],
    })
    expect(result.success).toBe(true)
  })

  it('should reject empty accountIds', () => {
    const result = createCampaignSchema.safeParse({
      userId: 'user1',
      accountIds: [],
      urls: ['https://x.com/user/status/1'],
    })
    expect(result.success).toBe(false)
  })

  it('should reject empty urls', () => {
    const result = createCampaignSchema.safeParse({
      userId: 'user1',
      accountIds: ['acc1'],
      urls: [],
    })
    expect(result.success).toBe(false)
  })

  it('should reject browsersCount > 5', () => {
    const result = createCampaignSchema.safeParse({
      userId: 'user1',
      accountIds: ['acc1'],
      urls: ['https://x.com/user/status/1'],
      browsersCount: 10,
    })
    expect(result.success).toBe(false)
  })
})

describe('seedSchema', () => {
  it('should accept valid seed data', () => {
    const result = seedSchema.safeParse({ email: 'admin@test.com', password: 'admin123' })
    expect(result.success).toBe(true)
  })

  it('should accept optional name', () => {
    const result = seedSchema.safeParse({ email: 'admin@test.com', password: 'admin123', name: 'Admin' })
    expect(result.success).toBe(true)
  })
})

describe('createClientSchema', () => {
  it('should accept valid client data', () => {
    const result = createClientSchema.safeParse({ email: 'client@test.com', name: 'Client Name' })
    expect(result.success).toBe(true)
  })

  it('should reject empty name', () => {
    const result = createClientSchema.safeParse({ email: 'client@test.com', name: '' })
    expect(result.success).toBe(false)
  })
})
