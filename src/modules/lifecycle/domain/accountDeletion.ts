import { createHmac, timingSafeEqual } from 'node:crypto'
import { machineSecretConfigured } from '@/src/modules/core/security/machineBearer'

export { ACCOUNT_DELETION_CONFIRMATION } from './accountDeletionConstants'

const REQUIRED_DELETION_ENVIRONMENT = [
  'CLERK_SECRET_KEY',
  'CLERK_WEBHOOK_SIGNING_SECRET',
  'DELETION_AUDIT_SECRET',
  'STRIPE_SECRET_KEY',
  'STRIPE_LIVEMODE',
] as const

const REQUIRED_INTAKE_ENVIRONMENT = [
  'CLERK_WEBHOOK_SIGNING_SECRET',
  'DELETION_AUDIT_SECRET',
] as const

export class AccountDeletionConfigurationError extends Error {
  constructor() {
    super('Account deletion is not configured')
    this.name = 'AccountDeletionConfigurationError'
  }
}

export function accountDeletionEnabled() {
  return process.env.ACCOUNT_DELETION_ENABLED?.trim() === 'true'
}

export function accountDeletionConfigurationReady() {
  if (!accountDeletionEnabled()
    || !REQUIRED_DELETION_ENVIRONMENT.every((name) => Boolean(process.env[name]?.trim()))) {
    return false
  }
  const livemode = process.env.STRIPE_LIVEMODE?.trim().toLowerCase()
  const key = process.env.STRIPE_SECRET_KEY!.trim()
  if (livemode !== 'true' && livemode !== 'false') return false
  const keyIsLive = key.startsWith('sk_live_') || key.startsWith('rk_live_')
  const keyIsTest = key.startsWith('sk_test_') || key.startsWith('rk_test_')
  return livemode === 'true' ? keyIsLive : keyIsTest
}

export function accountDeletionSelfServiceConfigurationReady() {
  return accountDeletionConfigurationReady()
    && process.env.DURABLE_WORKER_ENABLED?.trim() === 'true'
    && machineSecretConfigured(process.env.CRON_SECRET)
}

export function accountDeletionIntakeConfigurationReady() {
  return accountDeletionEnabled()
    && REQUIRED_INTAKE_ENVIRONMENT.every((name) => Boolean(process.env[name]?.trim()))
}

export function assertAccountDeletionEnabled() {
  if (!accountDeletionEnabled()) throw new AccountDeletionConfigurationError()
}

export function assertAccountDeletionConfigurationReady() {
  if (!accountDeletionConfigurationReady()) throw new AccountDeletionConfigurationError()
}

export function requireDeletionAuditSecret() {
  const secret = process.env.DELETION_AUDIT_SECRET?.trim()
  if (!secret) throw new AccountDeletionConfigurationError()
  return secret
}

export function deletionSubjectDigest(subject: string, secret = requireDeletionAuditSecret()) {
  return createHmac('sha256', secret).update(subject, 'utf8').digest('hex')
}

// Shared by lifecycle intake and auth resurrection checks. The default secret
// lookup fails closed when the deletion audit key is unavailable.
export function subjectDigestForUserId(userId: string) {
  return deletionSubjectDigest(userId)
}

export function stripeCustomerDigestForId(stripeCustomerId: string) {
  return deletionSubjectDigest(`stripe-customer:${stripeCustomerId}`)
}

export function deletionSubjectDigestMatches(subject: string, digest: string, secret = requireDeletionAuditSecret()) {
  const expected = Buffer.from(deletionSubjectDigest(subject, secret), 'hex')
  const actual = Buffer.from(digest, 'hex')
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}
