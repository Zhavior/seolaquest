import React from 'react'
import { Target, Compass, Gem } from 'lucide-react'
import { QuestPanel, questSurface } from '@/components/quest'

const features = [
  {
    icon: Target,
    title: 'Find relevant conversations',
    body: 'Track the problems, competitors, and phrases your potential customers discuss on X.'
  },
  {
    icon: Compass,
    title: 'Keep the context',
    body: 'Review the original source posts alongside scored matches before deciding what deserves attention.'
  },
  {
    icon: Gem,
    title: 'Choose your next conversation',
    body: 'Use what you find to shape customer interview questions, investigate a feature idea, or prepare a relevant response.'
  },
]

export function LandingFeatures() {
  return (
    <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pb-20 sm:pb-24">
      <div className="mb-5 max-w-2xl sm:mb-4">
        <p className="text-[11px] font-semibold text-ink-muted">
          What you get
        </p>
        <h2 className="font-display mt-2 text-3xl font-medium text-ink sm:text-4xl">
          Bring evidence to your next decision
        </h2>
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        {features.map((feature) => {
          const Icon = feature.icon
          return (
            <QuestPanel as="article" key={feature.title} padding="none" className="p-6">
              <span
                aria-hidden="true"
                className={questSurface({
                  border: 2,
                  shadow: 'xs',
                  tone: 'none',
                  className: 'mb-4 inline-flex h-11 w-11 items-center justify-center bg-highlight',
                })}
              >
                <Icon className="h-4 w-4" />
              </span>
              <h3 className="font-display text-2xl font-medium">{feature.title}</h3>
              <p className="mt-3 text-base font-medium leading-relaxed text-ink-muted">
                {feature.body}
              </p>
            </QuestPanel>
          )
        })}
      </div>
    </section>
  )
}
