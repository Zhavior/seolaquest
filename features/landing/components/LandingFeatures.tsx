import React from 'react'
import { Target, Compass, Gem } from 'lucide-react'
import { QuestPanel, questSurface } from '@/components/quest'

const features = [
  {
    icon: Target,
    title: 'Spot repeat buyer pain',
    body: 'Capture recurring public pain points and review the exact posts, phrases, and signals behind each result.'
  },
  {
    icon: Compass,
    title: 'Pick the next problem to validate',
    body: 'Review patterns, compare signals, and decide which customer problems are worth validating next.'
  },
  {
    icon: Gem,
    title: 'Keep coverage and limits visible',
    body: 'Source limits, coverage gaps, and product boundaries stay visible so you can trust what the signal actually means.'
  },
]

export function LandingFeatures() {
  return (
    <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pb-20 sm:pb-24">
      <div className="mb-5 max-w-2xl sm:mb-4">
        <p className="text-[11px] font-black uppercase tracking-[0.24em] text-ink/55">
          What you get
        </p>
        <h2 className="mt-2 text-3xl font-black uppercase tracking-[-0.04em] text-ink sm:text-4xl">
          Practical signal research, not vague dashboards
        </h2>
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        {features.map((feature) => {
          const Icon = feature.icon
          return (
            <QuestPanel as="article" key={feature.title} interactive padding="none" className="p-6">
              <span
                aria-hidden="true"
                className={questSurface({
                  border: 2,
                  shadow: 'xs',
                  tone: 'none',
                  className: 'mb-4 inline-flex h-11 w-11 items-center justify-center bg-[#fff3b0]',
                })}
              >
                <Icon className="h-4 w-4" />
              </span>
              <h3 className="text-2xl font-black uppercase">{feature.title}</h3>
              <p className="mt-3 text-base font-bold leading-relaxed text-ink-muted">
                {feature.body}
              </p>
            </QuestPanel>
          )
        })}
      </div>
    </section>
  )
}
