import { motion, Variants } from 'framer-motion'
import { FileText, Share2 } from 'lucide-react'
import { questSurface, type QuestTone } from '@/components/quest'

type GuildSecondaryStatsProps = {
  item: Variants
  spellsCast: number
  manaEfficiency: number
  manaPerReply: number
  questsExported: number
}

export function GuildSecondaryStats({ item, spellsCast, questsExported }: GuildSecondaryStatsProps) {
  return (
    <div className="flex flex-col gap-6 md:col-span-4 md:gap-8">
      <StatCard
        item={item}
        tone="white"
        headingId="guild-ai-drafts-heading"
        title="AI drafts"
        caption="Successful generations recorded"
        icon={<FileText aria-hidden="true" className="h-8 w-8 shrink-0" />}
        value={spellsCast}
        footnote="Reply sends, mana efficiency, and outcomes are not measured."
      />

      <StatCard
        item={item}
        tone="parchment"
        headingId="guild-crm-deliveries-heading"
        title="CRM deliveries"
        caption="Server-recorded completed exports"
        icon={<Share2 aria-hidden="true" className="h-8 w-8 shrink-0" />}
        value={questsExported}
        footnote="Provider readiness is not inferred from this historical count."
      />
    </div>
  )
}

function StatCard({
  item,
  tone,
  headingId,
  title,
  caption,
  icon,
  value,
  footnote,
}: {
  item: Variants
  tone: QuestTone
  headingId: string
  title: string
  caption: string
  icon: React.ReactNode
  value: number
  footnote: string
}) {
  return (
    <motion.section
      variants={item}
      aria-labelledby={headingId}
      className={questSurface({ tone, className: 'flex-1 p-6' })}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id={headingId} className="font-display text-2xl md:text-3xl font-normal text-ink">
            {title}
          </h2>
          <span className="mt-1 inline-block border border-outline bg-white/90 px-2 py-0.5 text-xs font-medium normal-case">
            {caption}
          </span>
        </div>
        {icon}
      </div>
      <p className="my-5 text-6xl font-semibold leading-none text-ink md:text-7xl">{value.toLocaleString()}</p>
      <p className={questSurface({ border: 2, shadow: 'sm', className: 'p-3 text-xs font-semibold normal-case' })}>
        {footnote}
      </p>
    </motion.section>
  )
}
