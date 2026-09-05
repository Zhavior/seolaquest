import { writeFileSync } from 'node:fs'
import { renderToStaticMarkup } from 'react-dom/server'
import { render, screen, cleanup } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
const mocks = vi.hoisted(() => ({ admin: vi.fn() }))
vi.mock('@/src/modules/admin/authorization', () => ({ getAdminIdentity: mocks.admin }))
vi.mock('@/src/modules/admin/AdminService', () => ({ AdminService: {
  overview: async () => ({ users: 0, onboarded: 0, activeSubscriptions: 0, leads: 0, outcomes: 0, newUsers: 0, enabledSchedules: 0 }),
  users: async () => ({ users: [], total: 0, page: 1 }),
  operations: async () => ({ jobs: [], providerAttempts: [], failedJobs: [], failedEvents: [], decisions: [], outcomes: [], audit: [] }),
} }))
import AdminPage from './page'
import AdminLayout from './layout'
import AdminUsersPage from './users/page'
import AdminOperationsPage from './operations/page'

beforeEach(() => mocks.admin.mockResolvedValue({ id: 'owner' }))
afterEach(cleanup)
describe('admin pages', () => {
  it('hides the complete workspace from non-admin visitors', async () => {
    mocks.admin.mockResolvedValue(null)
    await expect(AdminLayout({ children: <p>Private records</p> })).rejects.toThrow()
  })
  it('renders the real empty-data contract without invented users or revenue', async () => {
    mocks.admin.mockResolvedValue({ id: 'owner' })
    const page = await AdminLayout({ children: await AdminPage() })
    render(page)
    expect(screen.getByRole('heading', { name: 'Admin Mode' })).toBeInTheDocument()
    expect(screen.getByText('Total users')).toBeInTheDocument()
    expect(screen.queryByText(/MRR/)).not.toBeInTheDocument()
    if (process.env.ADMIN_PREVIEW_HTML) writeFileSync(process.env.ADMIN_PREVIEW_HTML,
      '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Admin rendering fixture</title><body><p>ISOLATED RENDER TEST · EMPTY FIXTURE DATA</p>' + renderToStaticMarkup(page) + '</body></html>')
  })
  it('renders searchable users with an explicit empty state', async () => {
    render(await AdminUsersPage({ searchParams: Promise.resolve({}) }))
    expect(screen.getByRole('textbox', { name: 'Search users by name or email' })).toBeInTheDocument()
    expect(screen.getByText('No users match this search.')).toBeInTheDocument()
  })
  it('renders operational empty states without claiming measured uptime', async () => {
    render(await AdminOperationsPage())
    expect(screen.getByText('No terminal failures recorded.')).toBeInTheDocument()
    expect(screen.getByText('No admin changes recorded.')).toBeInTheDocument()
  })
})
