import type { ReactNode } from "react"

interface IntelligenceAreaProps {
  keywords: ReactNode
  feed: ReactNode
}

export default function IntelligenceArea({
  keywords,
  feed,
}: IntelligenceAreaProps) {
  return (
    <section className="space-y-8">
      {keywords}
      {feed}
    </section>
  )
}
