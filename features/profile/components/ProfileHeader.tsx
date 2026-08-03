import { Shield } from 'lucide-react'

type ProfileHeaderProps = {
  user: { name: string; title: string; level: number }
  initials: string
}

export function ProfileHeader({ user, initials }: ProfileHeaderProps) {
  return (
    <header className="relative overflow-hidden border-4 border-black bg-[#ffd200] p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      <div className="relative z-10 flex items-center gap-5">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center border-4 border-black bg-cyan-400 text-3xl font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          {initials}
        </div>
        <div>
          <span className="inline-flex items-center gap-1 border border-black bg-white px-2.5 py-0.5 text-xs font-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <Shield className="h-3.5 w-3.5 text-blue-600" /> Stored profile
          </span>
          <h1 className="mt-2 text-3xl font-black uppercase tracking-tight md:text-4xl">{user.name}</h1>
          <p className="mt-1 text-sm font-bold text-slate-800">{user.title || 'No profile title set'}</p>
          <p className="mt-2 text-xs font-black uppercase text-slate-700">Stored level: {user.level}</p>
        </div>
      </div>
      <p className="mt-5 border-t-2 border-black/30 pt-3 text-xs font-bold uppercase text-slate-700">
        This page does not infer streaks, balances, lead totals, or global rank.
      </p>
    </header>
  )
}
