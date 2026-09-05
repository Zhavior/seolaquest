import { notFound } from 'next/navigation'
import { Sword, Zap } from 'lucide-react'
import HQButton from '@/components/seolaquest/ui/HQButton'
import { HQBadge } from '@/components/seolaquest/ui/HQBadge'
import { HQInput } from '@/components/seolaquest/ui/HQInput'
import { Card } from '@/components/seolaquest/ui/Card'

/**
 * Reference sheet for the neo-brutalist primitives, following the existing
 * `/dev/shell-v2` pattern.
 *
 * Two jobs. It renders every primitive in every state against fixed props, so
 * a change to the token layer shows its full blast radius on one screen. And
 * it is the source of the screenshots in the blog post that documents this
 * system — the article's code has to be code that actually runs, and this page
 * is what proves it does.
 *
 * Gated out of production like every other /dev route.
 */
export default function NeoBrutalistPreview() {
  if (process.env.NODE_ENV === 'production') notFound()

  return (
    <main className="min-h-screen bg-canvas p-6 md:p-10">
      <div className="mx-auto max-w-5xl space-y-10">
        <header className="border-4 border-outline bg-accent p-6 shadow-brutal-lg">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-ink-muted">
            Design reference — not routable in production
          </p>
          <h1 className="mt-2 text-4xl font-black uppercase tracking-tight">
            Neo-brutalist primitives
          </h1>
          <p className="mt-3 max-w-2xl font-bold text-ink/80">
            Every primitive, every state. Switch the theme to check that the offset slab and the
            focus ring both survive the swap.
          </p>
        </header>

        <Section title="Buttons — variants">
          <div className="flex flex-wrap items-center gap-4">
            <HQButton variant="primary" icon={<Zap size={16} />}>
              Primary
            </HQButton>
            <HQButton variant="secondary">Secondary</HQButton>
            <HQButton variant="ghost">Ghost</HQButton>
            <HQButton variant="danger">Danger</HQButton>
          </div>
        </Section>

        <Section title="Buttons — states">
          <div className="flex flex-wrap items-center gap-4">
            <HQButton variant="primary">Rest</HQButton>
            <HQButton variant="primary" disabled>
              Disabled
            </HQButton>
            <HQButton variant="secondary" icon={<Sword size={16} />}>
              With icon
            </HQButton>
            <HQButton variant="primary" className="w-full sm:w-auto">
              Merged className
            </HQButton>
          </div>
          <p className="mt-4 text-sm font-bold text-ink-muted">
            Hover lifts up and left as the slab grows. Press moves into the slab as it shrinks, so
            the footprint is conserved. Tab to any of them to see the ring plus halo.
          </p>
        </Section>

        <Section title="Badges — tones">
          <div className="flex flex-wrap items-center gap-3">
            <HQBadge>Neutral</HQBadge>
            <HQBadge tone="accent">Accent</HQBadge>
            <HQBadge tone="success">Healthy</HQBadge>
            <HQBadge tone="warning">Degraded</HQBadge>
            <HQBadge tone="danger">Down</HQBadge>
          </div>
        </Section>

        <Section title="Inputs — default, hint, error">
          <div className="grid gap-6 sm:grid-cols-3">
            <HQInput label="Keyword" placeholder="e.g. lead routing" />
            <HQInput label="Webhook URL" placeholder="https://" hint="Delivery retries three times." />
            <HQInput label="Seat count" defaultValue="0" error="Must be at least 1." />
          </div>
        </Section>

        <Section title="Cards — static and nested">
          <div className="grid gap-6 sm:grid-cols-2">
            <Card>
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-black uppercase">Radar</h3>
                <HQBadge tone="success">Live</HQBadge>
              </div>
              <p className="font-bold text-ink-muted">
                A container carries border-4 and shadow-brutal. The badge inside it sits one step
                down the scale.
              </p>
              <HQButton variant="secondary">Open</HQButton>
            </Card>

            <div className="border-4 border-outline bg-accent p-6 shadow-brutal">
              <h3 className="text-lg font-black uppercase">Bright panel</h3>
              <p className="mt-2 font-bold text-ink-muted">
                This caption uses text-ink-muted and still reads as translucent black, because a
                bright fill redefines ink for its own subtree.
              </p>
              <div className="mt-4 border-4 border-outline bg-card p-4">
                <p className="font-bold text-ink-muted">
                  Nested themed surface — ink reverts to the theme here.
                </p>
              </div>
            </div>
          </div>
        </Section>
      </div>
    </main>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="border-b-4 border-outline pb-2 text-xl font-black uppercase tracking-tight text-ink">
        {title}
      </h2>
      {children}
    </section>
  )
}
