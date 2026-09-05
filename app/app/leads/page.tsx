import Link from 'next/link'
import { requireCurrentUser } from '@/lib/auth'
import { LeadQueryService } from '@/src/modules/leads/application/LeadQueryService'
import { OutcomeControls } from './OutcomeControls'

export default async function LeadsPage() {
  const user = await requireCurrentUser()
  const leads = await LeadQueryService.tracked(user.id)
  return <main className="mx-auto max-w-4xl space-y-6 p-6">
    <Link href="/app" className="underline">Back to dashboard</Link>
    <h1 className="text-3xl font-semibold">Lead follow-up</h1>
    <p>Showing your 50 newest tracked leads. Contact, reply and sales outcomes are your reports, not independently verified sales or revenue.</p>
    {!leads.length && <p>Claim a lead on your dashboard to start tracking it here.</p>}
    {leads.map(lead => <article key={lead.id} className="space-y-4 rounded-xl border border-outline bg-card p-5">
      <h2 className="font-semibold">{lead.content}</h2>
      <p>Status: {lead.status.toLowerCase()}</p>
      <OutcomeControls leadId={lead.id} status={lead.status} />
      <details><summary className="cursor-pointer py-2">Recent history</summary>
        {!lead.outcomes.length ? <p>No recorded transitions. This status comes from an older record.</p> :
          <ol className="space-y-2">{lead.outcomes.map(outcome => <li key={outcome.id}>
            <time dateTime={outcome.createdAt.toISOString()}>{outcome.createdAt.toISOString().replace('T', ' ').slice(0, 16)} UTC</time>
            {' · '}{outcome.action.toLowerCase()}{' · '}{outcome.evidenceKind === 'CUSTOMER_REPORTED' ? 'Customer reported' : 'User action'}
            {outcome.notes && <p>{outcome.notes}</p>}
          </li>)}</ol>}
      </details>
    </article>)}
  </main>
}
