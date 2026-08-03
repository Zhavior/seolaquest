import React from 'react'
import { Target, Compass, Gem } from 'lucide-react'

const features = [
  {
    icon: Target,
    title: 'Track real signals',
    body: 'Save keyword-driven public matches and review the exact evidence that appeared during a scan.',
  },
  {
    icon: Compass,
    title: 'Decide next moves',
    body: 'Use a structured workflow to review findings, compare patterns, and choose where to dig deeper.',
  },
  {
    icon: Gem,
    title: 'Keep proof visible',
    body: 'Availability, provider limits, and product boundaries stay visible instead of being hidden behind hype.',
  },
]

export function LandingFeatures() {
  return (
    <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pb-20 sm:pb-24">
      <div className="grid gap-6 md:grid-cols-3">
        {features.map((feature) => {
          const Icon = feature.icon
          return (
            <article
              key={feature.title}
              className="border-4 border-black bg-white p-6 shadow-[8px_8px_0_0_#000]"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center border-3 border-black bg-[#FFE600] shadow-[3px_3px_0_0_#000]">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="text-2xl font-black uppercase">{feature.title}</h3>
              <p className="mt-3 text-base font-bold leading-relaxed text-zinc-700">
                {feature.body}
              </p>
            </article>
          )
        })}
      </div>
    </section>
  )
}
