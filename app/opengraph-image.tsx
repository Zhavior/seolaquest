import { ImageResponse } from 'next/og'

export const alt = 'SEOlaQuest: find buyers on X'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

/**
 * Generated rather than checked in as a PNG so the wording stays in source
 * control. The card is the handbook in miniature: a chrome-yellow board, a milk
 * acetate leaf with two punch holes and a hard cut shadow, and the seven-tab
 * rail down the fore edge.
 *
 * Colours are literal values (Satori has no CSS variables). They mirror the
 * volume hues in features/handbook/tokens.ts. Deliberately no custom font:
 * next/og would need the font bytes read from disk at build time.
 */
const TABS = ['#F2C400', '#0F8B8D', '#3E9A3A', '#2B3FA3', '#D4571E', '#8C4A2F', '#6A3FA0']

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ height: '100%', width: '100%', display: 'flex', backgroundColor: '#14120E' }}>
        <div
          style={{
            display: 'flex',
            flex: 1,
            position: 'relative',
            backgroundColor: '#F2C400',
            padding: 44,
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: 56,
              top: 56,
              right: 32,
              bottom: 32,
              backgroundColor: '#8F7600',
              display: 'flex',
            }}
          />
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              flex: 1,
              backgroundColor: '#F9EEA0',
              border: '3px solid #14120E',
              padding: '52px 64px 44px 104px',
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: 30,
                top: 44,
                width: 30,
                height: 30,
                borderRadius: 30,
                backgroundColor: '#F2C400',
                border: '3px solid #14120E',
                display: 'flex',
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: 30,
                bottom: 44,
                width: 30,
                height: 30,
                borderRadius: 30,
                backgroundColor: '#F2C400',
                border: '3px solid #14120E',
                display: 'flex',
              }}
            />
            <div style={{ display: 'flex', color: '#14120E', fontSize: 34, fontWeight: 700, letterSpacing: -1 }}>
              SEOlaQuest
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div
                style={{
                  display: 'flex',
                  color: '#14120E',
                  fontSize: 132,
                  lineHeight: 1,
                  fontWeight: 800,
                  letterSpacing: -5,
                }}
              >
                Find buyers
              </div>
              <div
                style={{
                  display: 'flex',
                  color: '#14120E',
                  fontSize: 132,
                  lineHeight: 1,
                  fontWeight: 800,
                  letterSpacing: -5,
                }}
              >
                on X.
              </div>
            </div>
            <div style={{ display: 'flex', color: '#4A4538', fontSize: 30 }}>
              Scan. Read the source post. Claim the lead. Level up.
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', width: 72, padding: '18px 0', gap: 6 }}>
          {TABS.map((color, index) => (
            <div
              key={color}
              style={{
                display: 'flex',
                flex: 1,
                marginLeft: index === 0 ? 0 : 8,
                marginRight: 8,
                backgroundColor: color,
                border: '3px solid #000',
              }}
            />
          ))}
        </div>
      </div>
    ),
    size,
  )
}
