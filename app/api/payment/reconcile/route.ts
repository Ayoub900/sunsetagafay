import { NextResponse, type NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { constantTimeEqual } from '@/lib/cmi/hash'
import { alertPayment } from '@/lib/cmi/observability'

// Scheduled reconciliation sweep. Call from a cron job (e.g. Vercel Cron or an
// external scheduler) with the shared secret. Surfaces orders that need manual
// verification against the CMI Merchant Center:
//   - PENDING older than 1h (customer may have paid then closed the tab, and the
//     callback also failed)
//   - anything UNDER_RECONCILIATION
// Optionally expires very old PENDING orders (>24h) to CANCELLED. Orders
// UNDER_RECONCILIATION are NEVER auto-expired.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const PENDING_STALE_MS = 60 * 60_000 // 1h
const PENDING_EXPIRE_MS = 24 * 60 * 60_000 // 24h

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const header =
    req.headers.get('x-cron-secret') ??
    req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ??
    ''
  return constantTimeEqual(header, secret)
}

async function sweep(expire: boolean) {
  const now = Date.now()
  const staleBefore = new Date(now - PENDING_STALE_MS)
  const expireBefore = new Date(now - PENDING_EXPIRE_MS)

  const [stalePending, underReconciliation] = await Promise.all([
    prisma.order.findMany({
      where: { status: 'PENDING', createdAt: { lt: staleBefore } },
      orderBy: { createdAt: 'asc' },
      select: { id: true, oid: true, amount: true, currency: true, createdAt: true, customerEmail: true },
    }),
    prisma.order.findMany({
      where: { status: 'UNDER_RECONCILIATION' },
      orderBy: { updatedAt: 'asc' },
      select: { id: true, oid: true, amount: true, currency: true, updatedAt: true, customerEmail: true },
    }),
  ])

  let expired = 0
  if (expire) {
    // Only PENDING (never UNDER_RECONCILIATION) may be auto-cancelled.
    const res = await prisma.order.updateMany({
      where: { status: 'PENDING', createdAt: { lt: expireBefore } },
      data: { status: 'CANCELLED' },
    })
    expired = res.count
  }

  if (stalePending.length || underReconciliation.length) {
    alertPayment('UNDER_RECONCILIATION', {
      stalePending: stalePending.length,
      underReconciliation: underReconciliation.length,
      expired,
    })
  }

  return {
    checkedAt: new Date(now).toISOString(),
    stalePending,
    underReconciliation,
    expired,
  }
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const expire = req.nextUrl.searchParams.get('expire') === 'true'
  return NextResponse.json(await sweep(expire))
}

export async function POST(req: NextRequest) {
  return GET(req)
}
