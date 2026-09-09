import { getServiceBookingRows } from '@/lib/db'
import { AdminTopbar } from '@/components/admin/AdminTopbar'
import { PageHead } from '@/components/admin/PageHead'
import { BookingsBoard } from './BookingsBoard'

// Day pass and transfer bookings taken on the site. A booking only becomes
// Confirmed when the CMI host-to-host callback marks its order PAID, so a
// Pending row with no order is an abandoned checkout, not a sale.
export const dynamic = 'force-dynamic'

export default async function ServiceBookingsPage() {
  // The payment state is derived server-side: "paying now" depends on the
  // clock, and a client-side Date.now() would not match what was rendered here.
  const { rows, today } = await getServiceBookingRows()

  return (
    <>
      <AdminTopbar crumbs={['Maison', 'Passes & Transfers']} />
      <PageHead
        title="Passes & Transfers"
        lede="Every day pass and transfer booked on the site, sorted newest first. Green means the card was charged and the money settled — anything else has not been paid yet."
      />
      <div style={{ padding: '8px 32px 48px' }}>
        {rows.length === 0 ? (
          <p style={{ fontFamily: 'var(--sans, system-ui)', fontSize: 14, color: '#807563' }}>
            No bookings yet. Set an online price on a day pass or transfer to start selling it.
          </p>
        ) : (
          <BookingsBoard rows={rows} today={today} />
        )}
      </div>
    </>
  )
}
