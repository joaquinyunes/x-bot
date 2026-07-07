import { describe, it, expect } from 'vitest'
import { generateRandomUser, randomDelay } from '../utils/randomizer'

describe('generateRandomUser', () => {
  it('should generate a user with all required fields', () => {
    const user = generateRandomUser()

    expect(user.name).toBeDefined()
    expect(typeof user.name).toBe('string')
    expect(user.name.length).toBeGreaterThan(0)

    expect(user.username).toBeDefined()
    expect(typeof user.username).toBe('string')
    expect(user.username.length).toBeGreaterThan(0)

    expect(user.password).toBeDefined()
    expect(user.password).toContain('X1!')
    expect(user.password.length).toBeGreaterThanOrEqual(17)

    expect(user.birthDate).toBeDefined()
    expect(user.birthDate.day).toBeGreaterThanOrEqual(1)
    expect(user.birthDate.day).toBeLessThanOrEqual(31)
    expect(user.birthDate.month).toBeGreaterThanOrEqual(1)
    expect(user.birthDate.month).toBeLessThanOrEqual(12)
    expect(user.birthDate.year).toBeGreaterThanOrEqual(1980)
    expect(user.birthDate.year).toBeLessThanOrEqual(2008)
  })

  it('should generate unique users on each call', () => {
    const users = new Set<string>()
    for (let i = 0; i < 50; i++) {
      users.add(generateRandomUser().username)
    }
    expect(users.size).toBeGreaterThan(1)
  })
})

describe('randomDelay', () => {
  it('should return a number within the specified range', async () => {
    for (let i = 0; i < 10; i++) {
      const delay = await randomDelay(100, 200)
      expect(delay).toBeGreaterThanOrEqual(100)
      expect(delay).toBeLessThanOrEqual(200)
    }
  }, 10000)

  it('should use default values when no args provided', async () => {
    const delay = await randomDelay()
    expect(delay).toBeGreaterThanOrEqual(1500)
    expect(delay).toBeLessThanOrEqual(4000)
  })
})
