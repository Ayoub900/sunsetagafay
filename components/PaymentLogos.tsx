// Security logos required on the checkout page by CMI certification. These are
// the OFFICIAL image files from the CMI integration kit
// (`3.Charte/logos de securite (obligatoires)`), copied to /public/payment:
//   cmi.png                 <- logo_cmi.png
//   verified-by-visa.png    <- tn_verified_by_visa.png
//   mastercard-securecode.png <- secure_code_logo.png
// Do not swap these for third-party recreations — the certification checklist
// verifies their presence on the page where the customer clicks "pay".

const LOGOS: { src: string; alt: string }[] = [
  { src: '/payment/cmi.png', alt: 'CMI — Centre Monétique Interbancaire' },
  { src: '/payment/verified-by-visa.png', alt: 'Verified by Visa' },
  { src: '/payment/mastercard-securecode.png', alt: 'Mastercard SecureCode' },
]

export default function PaymentLogos({ note }: { note?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center' }}>
        {LOGOS.map(l => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={l.src}
            src={l.src}
            alt={l.alt}
            height={34}
            style={{ height: 34, width: 'auto', display: 'block' }}
          />
        ))}
      </div>
      {note && (
        <p
          style={{
            fontFamily: 'var(--sans)',
            fontSize: 11,
            lineHeight: 1.6,
            color: 'var(--ink-soft)',
            margin: 0,
            letterSpacing: '0.02em',
          }}
        >
          {note}
        </p>
      )}
    </div>
  )
}
