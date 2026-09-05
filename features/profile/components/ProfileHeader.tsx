import { Shield } from 'lucide-react'

type ProfileHeaderProps = {
  user: { name: string; title: string; level: number }
  initials: string
}

export function ProfileHeader({ user, initials }: ProfileHeaderProps) {
  return (
    <header className="relative overflow-hidden rounded-[20px] border border-outline bg-forest text-on-forest p-6 shadow-sm">
      <div className="relative z-10 flex items-center gap-4">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[20px] border border-outline bg-highlight text-on-accent text-3xl font-semibold shadow-sm">
          {initials}
        </div>
        <div className="min-w-0">
          <span className="inline-flex items-center gap-1 border border-outline bg-card text-ink px-2.5 py-0.5 text-xs font-semibold normal-case shadow-none">
            <Shield className="h-3.5 w-3.5 text-blue-600" /> Stored profile
          </span>
          <h1 className="font-display mt-2 break-words text-3xl font-semibold normal-case tracking-tight md:text-4xl">{user.name}</h1>
          <p className="mt-1 text-sm font-medium text-on-forest/80">{user.title || 'No profile title set'}</p>
          <p className="mt-2 text-xs font-semibold normal-case text-on-forest/70">Stored level: {user.level}</p>
        </div>
      </div>
      <p className="mt-5 border-t border-outline/30 pt-3 text-xs font-medium normal-case text-on-forest/70">
        This page does not infer streaks, balances, lead totals, or global rank.
      </p>
    </header>
  )
}
