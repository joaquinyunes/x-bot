import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { handleApiError } from '@/lib/errors'

export async function GET() {
  try {
    const user = await getSession()
    return NextResponse.json(user)
  } catch (err) {
    const { error, status } = handleApiError(err)
    return NextResponse.json({ error }, { status })
  }
}
