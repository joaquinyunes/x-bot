import path from 'path'
import { createContext } from './browser'
import { createMailTmAccount, waitForVerificationCode } from '@/lib/mailtm/client'
import { generateRandomUser, randomDelay } from '@/lib/utils/randomizer'
import { sseManager } from '@/lib/sse/manager'
import { faker } from '@faker-js/faker'

const MAX_RETRIES = 3

async function retry<T>(
  fn: () => Promise<T>,
  label: string,
  accountId: string,
  retries = MAX_RETRIES
): Promise<T> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn()
    } catch (err) {
      sseManager.emitAccountEvent(accountId, 'step', {
        step: 'retry',
        message: `${label} failed (${attempt}/${retries}): ${err instanceof Error ? err.message : 'Unknown'}`,
      })
      if (attempt === retries) throw err
      await randomDelay(3000, 6000)
    }
  }
  throw new Error(`${label} failed after ${retries} retries`)
}

export async function createXAccount(sessionDir: string) {
  const accountId = `acc_${crypto.randomUUID().slice(0, 8)}`
  const user = generateRandomUser()
  const mail = await createMailTmAccount()

  sseManager.emitAccountEvent(accountId, 'step', {
    step: 'email_created',
    message: `Email ${mail.address} creado`,
  })

  const { browser, context } = await createContext()
  const page = await context.newPage()

  try {
    await retry(async () => {
      await page.goto('https://x.com/i/flow/signup', {
        waitUntil: 'networkidle',
        timeout: 30000,
      })
    }, 'Navigate to signup', accountId)

    await randomDelay(2000, 4000)

    sseManager.emitAccountEvent(accountId, 'step', {
      step: 'filling_form',
      message: 'Rellenando formulario...',
    })

    await retry(async () => {
      const nameInput = page.locator('input[name="name"], input[autocomplete="name"]').first()
      await nameInput.waitFor({ state: 'visible', timeout: 10000 })
      await nameInput.fill(user.name)
    }, 'Fill name', accountId)

    await randomDelay(1000, 2000)

    const emailInput = page.locator('input[type="email"], input[name="email"]').first()
    if (await emailInput.isVisible().catch(() => false)) {
      await emailInput.fill(mail.address)
    } else {
      const phoneInput = page.locator('input[type="tel"]').first()
      if (await phoneInput.isVisible().catch(() => false)) {
        const signUpWithEmail = page.getByText(/use email/i).first()
        if (await signUpWithEmail.isVisible().catch(() => false)) {
          await signUpWithEmail.click()
          await randomDelay(1000, 2000)
        }
        await page.locator('input[type="email"], input[name="email"]').first().fill(mail.address)
      }
    }

    await randomDelay(1000, 2000)

    const monthSelect = page.locator('select').first()
    if (await monthSelect.isVisible().catch(() => false)) {
      const selects = page.locator('select')
      const inputs = page.locator('input[inputmode="numeric"]')

      if ((await selects.count()) >= 1) {
        await selects.nth(0).selectOption(String(user.birthDate.month))
      }
      if ((await inputs.count()) >= 1) {
        await inputs.nth(0).fill(String(user.birthDate.day))
      }
      if ((await inputs.count()) >= 2) {
        await inputs.nth(1).fill(String(user.birthDate.year))
      }
    }

    await randomDelay(1000, 2000)

    const nextBtn = page.getByRole('button', { name: /next/i })
    if (await nextBtn.isVisible().catch(() => false)) {
      await nextBtn.click()
    }

    await randomDelay(2000, 4000)

    sseManager.emitAccountEvent(accountId, 'step', {
      step: 'waiting_code',
      message: 'Esperando código de verificación...',
    })

    const code = await retry(
      () => waitForVerificationCode(mail.address, mail.password),
      'Get verification code',
      accountId
    )

    sseManager.emitAccountEvent(accountId, 'step', {
      step: 'code_received',
      message: `Código recibido: ${code}`,
    })

    const codeInputs = page.locator('input[inputmode="numeric"]')
    const count = await codeInputs.count()
    for (let i = 0; i < count && i < code.length; i++) {
      await codeInputs.nth(i).fill(code[i])
    }

    await randomDelay(2000, 4000)

    sseManager.emitAccountEvent(accountId, 'step', {
      step: 'registering',
      message: 'Completando registro...',
    })

    const confirmNext = page.getByRole('button', { name: /next/i })
    if (await confirmNext.isVisible().catch(() => false)) {
      await confirmNext.click()
    }

    await randomDelay(2000, 4000)

    const usernameInput = page.locator('input[autocomplete="username"]').first()
    if (await usernameInput.isVisible().catch(() => false)) {
      await usernameInput.fill(user.username)
      await randomDelay(1000, 2000)
      const nextBtn2 = page.getByRole('button', { name: /next/i })
      if (await nextBtn2.isVisible().catch(() => false)) {
        await nextBtn2.click()
      }
      await randomDelay(2000, 4000)
    }

    const passwordInput = page.locator('input[type="password"]').first()
    if (await passwordInput.isVisible().catch(() => false)) {
      await passwordInput.fill(user.password)
      await randomDelay(1000, 2000)
      const nextBtn3 = page.getByRole('button', { name: /next/i })
      if (await nextBtn3.isVisible().catch(() => false)) {
        await nextBtn3.click()
      }
      await randomDelay(2000, 4000)
    }

    for (let i = 0; i < 5; i++) {
      const dismissBtn = page.getByRole('button', {
        name: /skip|not now|next|got it/i,
      }).first()
      if (await dismissBtn.isVisible().catch(() => false)) {
        await dismissBtn.click()
        await randomDelay(1500, 3000)
      }
    }

    const storagePath = path.join(sessionDir, `${user.username}.json`)
    await context.storageState({ path: storagePath })

    sseManager.emitAccountEvent(accountId, 'complete', {
      message: 'Cuenta creada exitosamente',
      username: user.username,
    })

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
    await browser.close()
  }
}
