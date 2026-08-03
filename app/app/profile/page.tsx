import type { Metadata } from 'next'
import { requireCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Mage Tower | HypeQuest',
  description: 'Review your guild master profile, class identity, and account state.',
}

function Field({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="border-4 border-black bg-white p-4 shadow-[4px_4px_0_0_#000]">
      <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-black/60">
        {label}
      </p>
      <p className="text-sm font-black uppercase tracking-[0.06em] text-black">
        {value}
      </p>
    </div>
  )
}

export default async function ProfilePage() {
  const user = await requireCurrentUser()

  const playerName = user.name?.trim() || user.email?.split('@')[0] || 'Guild Master'
  const className = user.title?.trim() || 'Lead Alchemist'
  const level = typeof user.level === 'number' ? String(user.level) : '12'
  const xp = typeof user.xp === 'number' ? String(user.xp) : '0'
  const xpRequired = typeof user.xpRequired === 'number' ? String(user.xpRequired) : '100'
  const questsRemaining =
    typeof user.questsRemaining === 'number' ? String(user.questsRemaining) : '0'
  const maxCredits = typeof user.maxCredits === 'number' ? String(user.maxCredits) : '0'

  return (
    <section className="space-y-5">
      <div className="border-4 border-black bg-[#FFE600] p-5 shadow-[6px_6px_0_0_#000]">
        <p className="mb-2 text-[10px] font-black uppercase tracking-[0.22em] text-black/65">
          Guild Master dossier
        </p>
        <h1 className="text-2xl font-black uppercase tracking-[0.06em] text-black">
          {playerName}
        </h1>
        <p className="mt-2 max-w-2xl text-sm font-bold uppercase tracking-[0.04em] text-black/75">
          Your class identity, progression state, and account operating profile.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Field label="Class" value={className} />
        <Field label="Level" value={level} />
        <Field label="XP" value={`${xp} / ${xpRequired}`} />
        <Field label="Active Quests" value={questsRemaining} />
        <Field label="Credit Capacity" value={maxCredits} />
        <Field label="Account Email" value={user.email ?? 'No email found'} />
      </div>
    </section>
  )
}
