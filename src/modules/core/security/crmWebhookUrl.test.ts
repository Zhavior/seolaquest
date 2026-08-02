import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { normalizeCrmWebhookUrl } from './crmWebhookUrl'

describe('normalizeCrmWebhookUrl', () => {
  it('normalizes a public HTTPS webhook and removes fragments', () => {
    expect(normalizeCrmWebhookUrl('  https://hooks.example.com/crm?team=1#secret  ')).toBe(
      'https://hooks.example.com/crm?team=1',
    )
    expect(normalizeCrmWebhookUrl('')).toBeNull()
  })

  it.each([
    'http://hooks.example.com/crm',
    'https://user:password@hooks.example.com/crm',
    'https://localhost/crm',
    'https://api.localhost/crm',
    'https://printer.local/crm',
    'https://127.0.0.1/crm',
    'https://10.1.2.3/crm',
    'https://169.254.169.254/latest/meta-data',
    'https://172.20.1.2/crm',
    'https://192.168.1.2/crm',
    'https://192.0.2.10/crm',
    'https://198.51.100.10/crm',
    'https://203.0.113.10/crm',
    'https://[::1]/crm',
    'https://[fd00::1]/crm',
    'https://[fe80::1]/crm',
    'https://[2001:db8::1]/crm',
  ])('rejects unsafe webhook target %s', (value) => {
    expect(() => normalizeCrmWebhookUrl(value)).toThrow()
  })

  it('allows a public literal IP over HTTPS', () => {
    expect(normalizeCrmWebhookUrl('https://8.8.8.8/webhook')).toBe('https://8.8.8.8/webhook')
  })
})
