import type { Metadata } from 'next'
import { Bodoni_Moda, Italianno, Work_Sans } from 'next/font/google'
import { headers } from 'next/headers'
import './globals.css'

const bodoniModa = Bodoni_Moda({
  subsets: ['latin'],
  weight: ['400', '500'],
  style: ['normal', 'italic'],
  variable: '--font-bodoni',
  display: 'swap',
})

const italianno = Italianno({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-italianno',
  display: 'swap',
})

const workSans = Work_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-work-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://sunsetagafay.com'),
  robots: { index: true, follow: true },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const h = await headers()
  const lang = h.get('x-locale') ?? 'en'

  return (
    <html
      lang={lang}
      className={`${bodoniModa.variable} ${italianno.variable} ${workSans.variable}`}
    >
      <body>{children}</body>
    </html>
  )
}
