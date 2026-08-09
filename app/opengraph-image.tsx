import { ImageResponse } from 'next/og'

export const alt = 'SEOlaQuest — AI social listening that turns X and Reddit chatter into leads'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

/**
 * Generated rather than checked in as a PNG so the wording stays in source
 * control and edits do not require a design round trip.
 *
 * Deliberately no custom font: `next/og` would need the font bytes read from
 * disk at build time, and the default sans already renders legibly at these
 * sizes. Colours are the literal brand tokens from `globals.css` — this runs in
 * Satori, which has no access to CSS variables or Tailwind.
 */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#0A0A0A',
          padding: 80,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div
            style={{
              width: 56,
              height: 56,
              backgroundColor: '#FFE600',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 34,
            }}
          >
            ⚔
          </div>
          <div style={{ color: '#FFE600', fontSize: 34, letterSpacing: 2, fontWeight: 700 }}>
            SEOLAQUEST
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/*
            Satori (which renders this) requires an explicit `display` on any
            element with more than one child, and it does not lay out <br />.
            Each headline line is therefore its own single-child block.
          */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ color: '#F3F4F6', fontSize: 68, lineHeight: 1.15, fontWeight: 700 }}>
              Your next customer is
            </div>
            <div style={{ color: '#F3F4F6', fontSize: 68, lineHeight: 1.15, fontWeight: 700 }}>
              already posting about it.
            </div>
          </div>
          <div style={{ color: '#9CA3AF', fontSize: 30, lineHeight: 1.4 }}>
            AI scouts watch X and Reddit for your keywords and deliver matched leads automatically.
          </div>
        </div>

        <div style={{ display: 'flex', height: 10, width: '100%' }}>
          <div style={{ flex: 1, backgroundColor: '#FFE600' }} />
          <div style={{ flex: 1, backgroundColor: '#FF5722' }} />
        </div>
      </div>
    ),
    size
  )
}
