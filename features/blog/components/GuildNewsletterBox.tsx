import { MailWarning } from 'lucide-react'

export function GuildNewsletterBox() {
  return (
    <div className="relative overflow-hidden border-4 border-black bg-[#FFE600] p-6 shadow-[8px_8px_0_0_#000] sm:p-8">
      <div className="flex items-start gap-4">
        <MailWarning className="h-8 w-8 shrink-0" />
        <div>
          <h3 className="text-2xl font-black uppercase text-black">Newsletter unavailable</h3>
          <p className="mt-2 max-w-2xl text-sm font-bold text-black/80">
            CoQuest does not currently persist subscribers or deliver email. No address is collected by this page.
          </p>
        </div>
      </div>
    </div>
  )
}
