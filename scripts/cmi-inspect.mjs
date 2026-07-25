import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const suffixes = ['EB3E34C8', 'DD601E02'] // from the two confirmation screenshots

function pick(raw, keys) {
  const out = {}
  if (!raw || typeof raw !== 'object') return out
  const lower = {}
  for (const k of Object.keys(raw)) lower[k.toLowerCase()] = raw[k]
  for (const k of keys) out[k] = lower[k.toLowerCase()] ?? ''
  return out
}

for (const suf of suffixes) {
  console.log('\n==================== oid ending', suf, '====================')
  const order = await prisma.order.findFirst({ where: { oid: { endsWith: suf } } })
  if (!order) { console.log('  (no order found)'); continue }
  console.log('ORDER:', JSON.stringify({
    oid: order.oid, status: order.status, cmiStatus: order.cmiStatus,
    amount: order.amount, maskedPan: order.maskedPan, cardBrand: order.cardBrand,
    procReturnCode: order.procReturnCode, mdStatus: order.mdStatus, txstatus: order.txstatus,
    transId: order.transId, authCode: order.authCode,
  }, null, 2))

  const cbs = await prisma.paymentCallback.findMany({ where: { oid: order.oid }, orderBy: { createdAt: 'asc' } })
  for (const cb of cbs) {
    const r = pick(cb.raw, ['mdStatus', 'txstatus', 'cavv', 'eci', 'xid', 'ProcReturnCode', 'Response', 'ErrMsg', 'clientid', 'storetype'])
    console.log(`  CALLBACK[${cb.channel}] hashValid=${cb.hashValid} sent=${cb.responseSent} ::`, JSON.stringify(r))
  }
}

await prisma.$disconnect()
