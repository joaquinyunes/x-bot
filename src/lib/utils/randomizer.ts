import { faker } from '@faker-js/faker'

export function generateRandomUser() {
  const firstName = faker.person.firstName()
  const lastName = faker.person.lastName()
  const month = faker.date.birthdate({ min: 18, max: 45, mode: 'age' })

  return {
    name: `${firstName} ${lastName}`,
    username: `${firstName.toLowerCase()}${faker.number.int({ min: 100, max: 999 })}`,
    password: faker.internet.password({ length: 14, memorable: false }) + 'X1!',
    birthDate: {
      day: month.getDate(),
      month: month.getMonth() + 1,
      year: month.getFullYear(),
    },
  }
}

export function randomDelay(min = 1500, max = 4000): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}
