import type { ReactNode } from 'react'

interface BattleAreaProps {
  desktop: ReactNode
  mobile: ReactNode
}

export default function BattleArea({
  desktop,
  mobile,
}: BattleAreaProps) {
  return (
    <>
      <div className="hidden lg:block">
        {desktop}
      </div>

      <div className="lg:hidden">
        {mobile}
      </div>
    </>
  )
}
