import HQStat from "./HQStat"

interface HQStatusBarProps {
  level: number
  xp: number
  mana: number
  quests: number
}

export default function HQStatusBar({
  level,
  xp,
  mana,
  quests,
}: HQStatusBarProps) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <HQStat
        label="Level"
        value={level}
        accent="gold"
      />

      <HQStat
        label="XP"
        value={xp.toLocaleString()}
        accent="turquoise"
      />

      <HQStat
        label="Mana"
        value={mana.toLocaleString()}
        accent="orange"
      />

      <HQStat
        label="Quests"
        value={quests}
      />
    </div>
  )
}
