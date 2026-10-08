import type { Metadata } from 'next'
import Link from 'next/link'
import { LocalTime } from '@/components/LocalTime'
import { requireCurrentUser } from '@/lib/auth'
import { LeadQueryService } from '@/src/modules/leads/application/LeadQueryService'
import { OutcomeControls } from './OutcomeControls'

const STATUS_LABEL: Record<string, string> = {
  CLAIMED: 'Saved, not contacted yet',
  CONTACTED: 'Contacted',
  REPLIED: 'They replied',
  QUALIFIED: 'Good fit',
  CONVERTED: 'Became a customer',
}

export const metadata: Metadata = {
  title: 'Follow-ups | SEOlaQuest',
}

export default async function LeadsPage() {
  const user = await requireCurrentUser()
  const leads = await LeadQueryService.tracked(user.id)
  // A <div>, not <main>: the app shell already provides the page's one <main>.
  return <div className="mx-auto max-w-4xl space-y-6 p-6">
    <Link href="/app" className="underline">Back to Home</Link>
    <h1 className="text-3xl font-semibold">Follow-ups</h1>
    <p>Leads you saved to follow up, newest first (up to 50). When you contact someone, or they reply, record it here. These are your own notes, not checked sales figures.</p>
    {!leads.length && <p>Nothing here yet. On Home, open a lead and choose “Save to follow-ups”. It will show up here so you can record what happens next. <Link href="/app" className="underline">Go to Home</Link></p>}
    {leads.map(lead => <article key={lead.id} className="space-y-4 rounded-xl border border-outline bg-card p-5">
      <h2 className="font-semibold">{lead.author ? `Post by ${lead.author}` : 'Post'}</h2>
      <p className="text-ink-muted">“{lead.content}”</p>
      <p>Status: {STATUS_LABEL[lead.status] ?? lead.status.toLowerCase()}</p>
      <OutcomeControls leadId={lead.id} status={lead.status} />
      <details><summary className="cursor-pointer py-2">Recent history</summary>
        {!lead.outcomes.length ? <p>No history saved for this lead yet.</p> :
          <ol className="space-y-2">{lead.outcomes.map(outcome => <li key={outcome.id}>
            <LocalTime iso={outcome.createdAt.toISOString()} />
            {' · '}{outcome.action.toLowerCase()}{' · '}{outcome.evidenceKind === 'CUSTOMER_REPORTED' ? 'Customer reported' : 'User action'}
            {outcome.notes && <p>{outcome.notes}</p>}
          </li>)}</ol>}
      </details>
    </article>)}
  </div>
}
