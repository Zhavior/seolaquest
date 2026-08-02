import 'server-only'

import { BlockList, isIP } from 'node:net'

export class UnsafeCrmWebhookUrlError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'UnsafeCrmWebhookUrlError'
  }
}

const nonPublicAddresses = new BlockList()
nonPublicAddresses.addSubnet('0.0.0.0', 8, 'ipv4')
nonPublicAddresses.addSubnet('10.0.0.0', 8, 'ipv4')
nonPublicAddresses.addSubnet('100.64.0.0', 10, 'ipv4')
nonPublicAddresses.addSubnet('127.0.0.0', 8, 'ipv4')
nonPublicAddresses.addSubnet('169.254.0.0', 16, 'ipv4')
nonPublicAddresses.addSubnet('172.16.0.0', 12, 'ipv4')
nonPublicAddresses.addSubnet('192.0.0.0', 24, 'ipv4')
nonPublicAddresses.addSubnet('192.0.2.0', 24, 'ipv4')
nonPublicAddresses.addSubnet('192.168.0.0', 16, 'ipv4')
nonPublicAddresses.addSubnet('198.18.0.0', 15, 'ipv4')
nonPublicAddresses.addSubnet('198.51.100.0', 24, 'ipv4')
nonPublicAddresses.addSubnet('203.0.113.0', 24, 'ipv4')
nonPublicAddresses.addSubnet('224.0.0.0', 4, 'ipv4')
nonPublicAddresses.addSubnet('::', 96, 'ipv6')
nonPublicAddresses.addSubnet('64:ff9b::', 96, 'ipv6')
nonPublicAddresses.addSubnet('100::', 64, 'ipv6')
nonPublicAddresses.addSubnet('2001::', 32, 'ipv6')
nonPublicAddresses.addSubnet('2001:db8::', 32, 'ipv6')
nonPublicAddresses.addSubnet('2002::', 16, 'ipv6')
nonPublicAddresses.addSubnet('fc00::', 7, 'ipv6')
nonPublicAddresses.addSubnet('fe80::', 10, 'ipv6')
nonPublicAddresses.addSubnet('ff00::', 8, 'ipv6')

export function assertPublicIpAddress(address: string) {
  const family = isIP(address)
  const isMappedIpv4 = family === 6 && address.toLowerCase().startsWith('::ffff:')
  if (!family || isMappedIpv4 || nonPublicAddresses.check(address, family === 4 ? 'ipv4' : 'ipv6')) {
    throw new UnsafeCrmWebhookUrlError('CRM webhook cannot target a non-public network address.')
  }
}

function assertPublicHostname(rawHostname: string) {
  const hostname = rawHostname.replace(/^\[|\]$/g, '').replace(/\.$/, '').toLowerCase()

  if (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local')
  ) {
    throw new UnsafeCrmWebhookUrlError('CRM webhook must use a public hostname.')
  }

  const ipVersion = isIP(hostname)
  if (ipVersion) assertPublicIpAddress(hostname)
}

export function normalizeCrmWebhookUrl(value?: string | null) {
  const trimmed = value?.trim()
  if (!trimmed) return null
  if (trimmed.length > 2048) {
    throw new UnsafeCrmWebhookUrlError('CRM webhook URL is too long.')
  }

  let url: URL
  try {
    url = new URL(trimmed)
  } catch {
    throw new UnsafeCrmWebhookUrlError('Enter a valid CRM webhook URL.')
  }

  if (url.protocol !== 'https:') {
    throw new UnsafeCrmWebhookUrlError('CRM webhook must use HTTPS.')
  }
  if (url.username || url.password) {
    throw new UnsafeCrmWebhookUrlError('CRM webhook URL cannot contain credentials.')
  }

  assertPublicHostname(url.hostname)
  url.hash = ''
  return url.toString()
}
