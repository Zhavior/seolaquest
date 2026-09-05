import { MailWarning } from 'lucide-react'

export function GuildNewsletterBox() {
  return (
    <div className="relative overflow-hidden rounded-xl border border-outline bg-accent p-6 sm:p-8">
      <div className="flex items-start gap-4">
        <MailWarning className="h-8 w-8 shrink-0" />
        <div>
          <h3 className="font-display text-2xl font-medium text-ink">Newsletter unavailable</h3>
          <p className="mt-2 max-w-2xl text-sm font-medium text-ink/80">
            SEOlaQuest does not currently persist subscribers or deliver email. No address is collected by this page.
          </p>
        </div>
      </div>
    </div>
  )
}
