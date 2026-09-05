import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { OutcomeControls } from './OutcomeControls'
const refresh = vi.hoisted(() => vi.fn())
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }))
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.clearAllMocks() })
it('reuses the receipt after an uncertain save and refreshes only after success', async () => {
  const fetcher = vi.fn().mockRejectedValueOnce(new Error('network')).mockResolvedValueOnce({ ok: true, json: async () => ({ outcome: {} }) })
  vi.stubGlobal('fetch', fetcher)
  render(<OutcomeControls leadId="lead-1" status="CLAIMED" />)
  expect(screen.queryByText('Report conversion')).not.toBeInTheDocument()
  fireEvent.change(screen.getByRole('combobox'), { target: { value: 'CONTACT' } })
  fireEvent.click(screen.getByRole('button'))
  await screen.findByText('Could not confirm the save. Retry the same update safely.')
  expect(refresh).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button'))
  await waitFor(() => expect(refresh).toHaveBeenCalledOnce())
  expect(fetcher.mock.calls[0][0]).toBe('/api/v1/leads/lead-1/outcomes')
  expect(fetcher.mock.calls[0][1]).toEqual(fetcher.mock.calls[1][1])
  expect(JSON.parse(fetcher.mock.calls[1][1].body)).toEqual({ action: 'CONTACT', notes: '' })
})
it('shows server rejections without claiming success', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, json: async () => ({ error: 'Lead not found' }) }))
  render(<OutcomeControls leadId="other" status="CONTACTED" />)
  fireEvent.change(screen.getByRole('combobox'), { target: { value: 'CONVERT' } })
  fireEvent.click(screen.getByRole('button'))
  await screen.findByText('Lead not found')
  expect(refresh).not.toHaveBeenCalled()
})
