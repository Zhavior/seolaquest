import type { ReactNode } from "react"
import HQSection from "./HQSection"

interface HQRadarSectionProps {
  actions?: ReactNode
  children: ReactNode
}

export default function HQRadarSection({
  actions,
  children,
}: HQRadarSectionProps) {
  return (
    <HQSection
      title="Tactical Radar"
      subtitle="Live campaign intelligence"
      actions={actions}
    >
      {children}
    </HQSection>
  )
}
