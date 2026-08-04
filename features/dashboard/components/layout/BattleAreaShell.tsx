import type { ReactNode } from "react"

interface BattleAreaShellProps {
  mission: ReactNode
  status: ReactNode
  actions: ReactNode
  radar: ReactNode
  activity: ReactNode
}

export default function BattleAreaShell({
  mission,
  status,
  actions,
  radar,
  activity,
}: BattleAreaShellProps) {
  return (
    <div className="space-y-6">

      {mission}

      {status}

      {actions}

      <div className="grid gap-6 xl:grid-cols-[1.45fr_1fr]">
        {radar}

        {activity}
      </div>

    </div>
  )
}
