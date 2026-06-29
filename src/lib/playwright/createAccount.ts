import path from 'path'
import { createContext } from './browser'
import { createMailTmAccount, waitForVerificationCode } from '@/lib/mailtm/client'
import { generateRandomUser, randomDelay } from '@/lib/utils/randomizer'

export async function createXAccount(sessionDir: string) {
  const user = generateRandomUser()
  const mail = await createMailTmAccount()

  const context = await createContext()
  const page = await context.newPage()

  try {
    await page.goto('https://x.com/i/flow/signup', { waitUntil: 'networkidle' })
    await randomDelay(2000, 4000)

    await page.getByLabel('Name').fill(user.name)
    await randomDelay(1000, 2000)

    const emailInput = page.getByLabel('Email', { exact: true })
    const phoneInput = page.getByLabel('Phone')

    if (await emailInput.isVisible()) {
      await emailInput.fill(mail.address)
    } else if (await phoneInput.isVisible()) {
      await page.getByLabel(/use email/i).click()
      await randomDelay(500, 1000)
      await page.getByLabel('Email', { exact: true }).fill(mail.address)
    }

    await randomDelay(1000, 2000)

    const monthSelect = page.locator('select#SELECTOR_1')
    const dayInput = page.locator('input#SELECTOR_2')
    const yearInput = page.locator('input#SELECTOR_3')

    if (await monthSelect.isVisible()) {
      await monthSelect.selectOption(String(user.birthDate.month))
      await dayInput.fill(String(user.birthDate.day))
      await yearInput.fill(String(user.birthDate.year))
    }

    await randomDelay(1000, 2000)
    await page.getByRole('button', { name: /next/i }).click()
    await randomDelay(2000, 4000)

    const code = await waitForVerificationCode(mail.address, mail.password)
    await randomDelay(500, 1000)

    const codeInputs = page.locator('input[inputmode="numeric"]')
    const count = await codeInputs.count()
    for (let i = 0; i < count && i < code.length; i++) {
      await codeInputs.nth(i).fill(code[i])
    }

    await randomDelay(2000, 4000)
    await page.getByRole('button', { name: /next/i }).click()
    await randomDelay(2000, 4000)

    const usernameInput = page.getByLabel(/username/i)
    if (await usernameInput.isVisible()) {
      await usernameInput.fill(user.username)
      await randomDelay(1000, 2000)
      await page.getByRole('button', { name: /next/i }).click()
      await randomDelay(2000, 4000)
    }

    const passwordInput = page.getByLabel(/password/i)
    if (await passwordInput.isVisible()) {
      await passwordInput.fill(user.password)
      await randomDelay(1000, 2000)
      await page.getByRole('button', { name: /next/i }).click()
      await randomDelay(2000, 4000)
    }

    for (let i = 0; i < 5; i++) {
      const skipBtn = page.getByRole('button', { name: /skip|not now|next/i })
      if (await skipBtn.isVisible().catch(() => false)) {
        await skipBtn.click()
        await randomDelay(1500, 3000)
      }
    }

    const storagePath = path.join(sessionDir, `${user.username}.json`)
    await context.storageState({ path: storagePath })

    return {
      username: user.username,
      passwordX: user.password,
      email: mail.address,
      passwordMail: mail.password,
      storagePath,
    }
  } finally {
    await page.close()
    await context.close()
  }
}
