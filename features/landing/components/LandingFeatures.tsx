import React from 'react'
import { Target, Compass, Gem } from 'lucide-react'

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
        <p className="text-[11px] font-black uppercase tracking-[0.24em] text-black/55">
          What you get
        </p>
        <h2 className="mt-2 text-3xl font-black uppercase tracking-[-0.04em] text-black sm:text-4xl">
          Practical signal research, not vague dashboards
        </h2>
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        {features.map((feature) => {
          const Icon = feature.icon
          return (
            <article
              key={feature.title}
              className="border-4 border-black bg-white p-6 shadow-[6px_6px_0_0_#000] transition-transform duration-150 ease-out will-change-transform hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[8px_8px_0_0_#000] motion-reduce:transition-none motion-reduce:hover:translate-x-0 motion-reduce:hover:translate-y-0"
            >
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center border-2 border-black bg-[#fff3b0] shadow-[2px_2px_0_0_#000]">
                <Icon className="h-4 w-4" />
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
