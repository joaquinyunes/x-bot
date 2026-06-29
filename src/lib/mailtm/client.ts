const MAILTM_API = process.env.MAILTM_API_URL ?? 'https://api.mail.tm'

interface MailTmAccount {
  id: string
  address: string
  password: string
}

interface MailTmMessage {
  id: string
  from: { address: string; name: string }
  to: { address: string; name: string }
  subject: string
  intro: string
  createdAt: string
}

export async function createMailTmAccount(): Promise<MailTmAccount> {
  const domainsRes = await fetch(`${MAILTM_API}/domains`, {
    next: { revalidate: 3600 },
  })
  const domains = await domainsRes.json()
  const domain = domains['hydra:member']?.[0]?.domain
  if (!domain) throw new Error('No mail.tm domains available')

  const random = crypto.randomUUID().slice(0, 8)
  const address = `user_${random}@${domain}`
  const password = crypto.randomUUID().slice(0, 16)

  const res = await fetch(`${MAILTM_API}/accounts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address, password }),
  })

  if (!res.ok) throw new Error(`Mail.tm account creation failed: ${res.status}`)

  return { id: (await res.json()).id, address, password }
}

async function getToken(address: string, password: string): Promise<string> {
  const res = await fetch(`${MAILTM_API}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address, password }),
  })
  if (!res.ok) throw new Error('Mail.tm auth failed')
  return (await res.json()).token
}

export async function waitForVerificationCode(
  address: string,
  password: string,
  timeoutMs = 120_000
): Promise<string> {
  const token = await getToken(address, password)
  const start = Date.now()

  while (Date.now() - start < timeoutMs) {
    const res = await fetch(`${MAILTM_API}/messages`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await res.json()
    const messages: MailTmMessage[] = data['hydra:member'] ?? []

    for (const msg of messages) {
      const contentRes = await fetch(`${MAILTM_API}/messages/${msg.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const content = await contentRes.json()
      const html = content.html?.[0] ?? ''
      const text = content.text?.[0] ?? ''
      const body = html + text

      const match = body.match(/\b(\d{6})\b/)
      if (match) return match[1]
    }

    await new Promise((r) => setTimeout(r, 3000))
  }

  throw new Error('Verification code not received within timeout')
}
