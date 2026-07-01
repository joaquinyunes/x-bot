import { NextResponse } from 'next/server'
import { getDashboardMetrics } from '@/lib/metrics'
import { getSession } from '@/lib/session'

export async function GET() {
  try {
    const session = await getSession()
    const metrics = await getDashboardMetrics(
      session.role === 'ADMIN' ? undefined : session.id
    )
    return NextResponse.json(metrics)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
