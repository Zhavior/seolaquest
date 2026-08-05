import HQButton from "@/components/coquest/ui/HQButton"

interface MissionCardCompactProps {
  title: string
  progress: number
  xp: number
  mana: number
  onDeploy?: () => void
}

export default function MissionCardCompact({
  title,
  progress,
  xp,
  mana,
  onDeploy,
}: MissionCardCompactProps) {
  return (
    <section className="rounded-none border-4 border-outline bg-highlight p-4 shadow-brutal-lg">

      <p className="text-xs font-black uppercase tracking-[0.12em] text-ink/60">
        Today&apos;s Mission
      </p>

      <h2 className="mt-2 text-xl font-black uppercase leading-tight">
        {title}
      </h2>

      <div className="mt-4 h-3 overflow-hidden border-2 border-outline bg-card">

        <div
          className="h-full bg-[#13D7C2]"
          style={{
            width: `${Math.max(0, Math.min(progress, 100))}%`,
          }}
        />

      </div>

      <div className="mt-3 flex items-center justify-between text-xs font-black uppercase">

        <span>
          +{xp} XP
        </span>

        <span>
          +{mana} Mana
        </span>

      </div>

      <HQButton
        className="mt-4 w-full"
        onClick={onDeploy}
      >
        Deploy Mission
      </HQButton>

    </section>
  )
}
