// Renders the payment emails to HTML files you can open in a browser, without
// sending anything and without needing a Resend key.
//
//   npx tsx scripts/preview-emails.mjs      # if tsx is available
//   node --experimental-strip-types scripts/preview-emails.mjs
//
// Output: .email-preview/{customer,customer-fr,admin}-{stay,day-pass,transfer}.html

import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { buildAdminEmail, buildCustomerEmail } from '../lib/email/templates.ts'

const OUT = '.email-preview'

const samples = {
  transfer: {
    kind: 'transfer',
    itemName: 'Airport Day Transfer',
    amountLabel: '1200.00 MAD',
    rows: [
      ['Date', '2026-10-02'],
      ['Pickup time', '08:45'],
      ['Passengers', '2 passengers + 1 child'],
      ['Pickup', 'Marrakech-Menara Airport, Terminal 1'],
      ['Drop-off', 'Sunset Agafay'],
    ],
    notes: 'Flight AT201, two large cases',
  },
  'day-pass': {
    kind: 'day-pass',
    itemName: 'Day Pass Swimming Pool & Dinner',
    amountLabel: '1650.00 MAD',
    rows: [
      ['Date', '2026-09-25'],
      ['Start time', '17:00'],
      ['Guests', '2 adults + 1 child'],
    ],
    notes: '',
  },
  stay: {
    kind: 'stay',
    itemName: 'Suite Sunset',
    amountLabel: '11600.00 MAD',
    rows: [
      ['Check-in', '2026-10-10'],
      ['Check-out', '2026-10-12'],
      ['Nights', '2'],
      ['Guests', '2'],
    ],
    notes: 'Country: France',
  },
}

const common = {
  lang: 'en',
  reference: 'SA-F2BDC5',
  oid: 'SAMTLTQIWX853A7E8B8347',
  customerName: 'Amina Benali',
  customerEmail: 'guest@example.com',
  customerPhone: '+212 600 000 000',
  adminRows: [
    ['Card', 'VISA 411111******1111'],
    ['Transaction', 'TX20260925A1'],
    ['Auth code', '123456'],
    ['Paid at', '2026-09-25 16:04:11 UTC'],
  ],
  siteUrl: 'https://sunsetagafay.com',
}

await mkdir(OUT, { recursive: true })

for (const [name, sample] of Object.entries(samples)) {
  const data = { ...common, ...sample }
  const files = [
    [`customer-${name}.html`, buildCustomerEmail(data)],
    [`customer-fr-${name}.html`, buildCustomerEmail({ ...data, lang: 'fr' })],
    [`admin-${name}.html`, buildAdminEmail(data)],
  ]
  for (const [file, mail] of files) {
    await writeFile(join(OUT, file), mail.html, 'utf8')
    console.log(`${file.padEnd(30)} ${mail.subject}`)
  }
}

console.log(`\nOpen the files in ./${OUT}/`)
