import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { getDictionary, hasLocale, type Locale } from './dictionaries'

export const alt = 'Sunset Agafay — Boutique Kasbah in the Agafay Desert'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const safeLang: Locale = hasLocale(lang) ? (lang as Locale) : 'en'
  const dict = await getDictionary(safeLang)

  const logoData = await readFile(join(process.cwd(), 'public', 'logo_emblem_gold.png'))
  const logoSrc = `data:image/png;base64,${logoData.toString('base64')}`

  const eyebrow = safeLang === 'fr' ? 'KASBAH BOUTIQUE · DÉSERT D’AGAFAY' : 'BOUTIQUE KASBAH · AGAFAY DESERT'
  const title = 'Sunset Agafay'
  const tagline = safeLang === 'fr'
    ? 'Une heure au sud de Marrakech.'
    : 'One hour south of Marrakech.'
  const description = dict.meta.home_description

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: '#F2E8D5',
          color: '#1F1A14',
          padding: '80px 96px',
          position: 'relative',
          fontFamily: 'serif',
        }}
      >
        <div
          style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 6,
            background: 'linear-gradient(90deg, #A04A2A 0%, #B8893A 50%, #A04A2A 100%)',
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <img src={logoSrc} width={56} height={56} alt="" />
          <div
            style={{
              fontSize: 16,
              letterSpacing: '0.28em',
              color: '#A04A2A',
              textTransform: 'uppercase',
            }}
          >
            {eyebrow}
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div
            style={{
              fontSize: 124,
              lineHeight: 1,
              letterSpacing: '-0.024em',
              color: '#1F1A14',
              margin: 0,
            }}
          >
            {title}
          </div>
          <div
            style={{
              marginTop: 28,
              fontSize: 36,
              fontStyle: 'italic',
              color: '#B8893A',
              lineHeight: 1.15,
              maxWidth: 920,
            }}
          >
            {tagline}
          </div>
          <div
            style={{
              marginTop: 28,
              fontSize: 22,
              lineHeight: 1.45,
              color: '#3A3026',
              maxWidth: 880,
            }}
          >
            {description}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            fontSize: 16,
            letterSpacing: '0.24em',
            color: '#3A3026',
            textTransform: 'uppercase',
            borderTop: '1px solid rgba(31,26,20,0.18)',
            paddingTop: 28,
          }}
        >
          <div>sunsetagafay.com</div>
          <div>{safeLang === 'fr' ? 'Marrakech · Maroc' : 'Marrakech · Morocco'}</div>
        </div>
      </div>
    ),
    { ...size }
  )
}
