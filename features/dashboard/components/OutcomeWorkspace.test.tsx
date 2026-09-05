import { writeFileSync } from 'node:fs'
import { renderToStaticMarkup } from 'react-dom/server'
import { render, screen, cleanup } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { OutcomeWorkspace } from './OutcomeWorkspace'
vi.mock('@/app/app/leads/OutcomeControls', () => ({ OutcomeControls: () => <button>Save reported outcome</button> }))
afterEach(cleanup)
it('distinguishes unavailable data from an empty account', () => {
  render(<OutcomeWorkspace pipeline={null} scans={null} checkedAt="2026-09-05T12:00:00.000Z" />)
  expect(screen.getByText('Pipeline unavailable. Counts could not be loaded.')).toBeInTheDocument()
  expect(screen.queryByText('0 replies · 0 qualified · 0 conversions')).not.toBeInTheDocument()
})
it('renders real counts, follow-up actions and scan details without claiming verified revenue', () => {
  render(<OutcomeWorkspace checkedAt="2026-09-05T12:00:00.000Z" pipeline={{ stages: { CLAIMED: 2 }, reports: { REPLY: 1 }, followUps: [{ id: 'lead-1', content: 'Looking for CRM', status: 'CLAIMED' }] }} scans={[{
    id: 'run-1', status: 'FAILED_REFUNDED', statusMessage: 'Scan failed; credit refunded.', providerSummary: 'Source unavailable.', providerHealth: 'UNAVAILABLE', trigger: 'MANUAL', counts: { leadsCreated: 0, providerAttempts: 1, providerResults: 0 }, refunded: true, refundMessage: 'Refunded', customerError: null, currentBalance: null, createdAt: '2026-09-05T12:00:00Z', updatedAt: '2026-09-05T12:00:00Z', completedAt: '2026-09-05T12:00:00Z',
  }]} />)
  expect(screen.getByText('1 replies · 0 qualified · 0 conversions')).toBeInTheDocument()
  expect(screen.getByText('Source unavailable.')).toBeInTheDocument()
  expect(screen.getByText('Scan failed; credit refunded.').closest('a')).toHaveAttribute('href', '/app/runs/run-1')
  expect(screen.getByText('Recorded reports only. These are not verified sales or revenue.')).toBeInTheDocument()
})

it('renders an explicit empty fixture for visual verification', () => {
  const view = <OutcomeWorkspace pipeline={{ stages: {}, reports: {}, followUps: [] }} scans={[]} checkedAt="2026-09-05T12:00:00Z" />
  render(view)
  expect(screen.getByText('Claim a lead from the review queue to start following up.')).toBeInTheDocument()
  if (process.env.DASHBOARD_PREVIEW_HTML) writeFileSync(process.env.DASHBOARD_PREVIEW_HTML,
    '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Dashboard fixture</title><body><p>VISUAL TEST — EMPTY FIXTURE DATA</p>' + renderToStaticMarkup(view) + '</body></html>')
})
