import { Shield } from 'lucide-react'

type ProfileHeaderProps = {
  user: { name: string; title: string; level: number }
  initials: string
}

export function ProfileHeader({ user, initials }: ProfileHeaderProps) {
  return (
    <header className="relative overflow-hidden border-4 border-outline bg-[#ffd200] p-6 shadow-brutal-lg">
      <div className="relative z-10 flex items-center gap-5">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center border-4 border-outline bg-cyan-400 text-3xl font-black shadow-brutal">
          {initials}
        </div>
        <div>
          <span className="inline-flex items-center gap-1 border border-outline bg-card px-2.5 py-0.5 text-xs font-black uppercase shadow-brutal-sm">
            <Shield className="h-3.5 w-3.5 text-blue-600" /> Stored profile
          </span>
          <h1 className="mt-2 text-3xl font-black uppercase tracking-tight md:text-4xl">{user.name}</h1>
          <p className="mt-1 text-sm font-bold text-ink">{user.title || 'No profile title set'}</p>
          <p className="mt-2 text-xs font-black uppercase text-ink-muted">Stored level: {user.level}</p>
        </div>
      </div>
      <p className="mt-5 border-t-2 border-outline/30 pt-3 text-xs font-bold uppercase text-ink-muted">
        This page does not infer streaks, balances, lead totals, or global rank.
      </p>
    </header>
  )
}
