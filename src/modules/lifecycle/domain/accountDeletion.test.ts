import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  AccountDeletionConfigurationError,
  accountDeletionConfigurationReady,
  accountDeletionEnabled,
  accountDeletionIntakeConfigurationReady,
  accountDeletionSelfServiceConfigurationReady,
  assertAccountDeletionConfigurationReady,
  assertAccountDeletionEnabled,
  deletionSubjectDigest,
  deletionSubjectDigestMatches,
  requireDeletionAuditSecret,
  stripeCustomerDigestForId,
  subjectDigestForUserId,
} from './accountDeletion'

describe('account deletion audit identity', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('creates a deterministic HMAC-SHA256 digest without retaining the subject', () => {
    const digest = deletionSubjectDigest('user_clerk_secret', 'audit-secret-a')

    expect(digest).toHaveLength(64)
    expect(digest).not.toContain('user_clerk_secret')
    expect(digest).toBe(deletionSubjectDigest('user_clerk_secret', 'audit-secret-a'))
    expect(digest).not.toBe(deletionSubjectDigest('user_clerk_secret', 'audit-secret-b'))
    expect(deletionSubjectDigestMatches('user_clerk_secret', digest, 'audit-secret-a')).toBe(true)
    expect(deletionSubjectDigestMatches('user_other', digest, 'audit-secret-a')).toBe(false)
  })

  it('domain-separates Stripe customer tombstones from Clerk user tombstones', () => {
    vi.stubEnv('DELETION_AUDIT_SECRET', 'audit-secret-a')

    expect(stripeCustomerDigestForId('cus_1')).toHaveLength(64)
    expect(stripeCustomerDigestForId('cus_1')).not.toBe(subjectDigestForUserId('cus_1'))
  })

  it('fails closed when deletion intake secrets are incomplete', () => {
    vi.stubEnv('ACCOUNT_DELETION_ENABLED', 'true')
    vi.stubEnv('CLERK_SECRET_KEY', 'sk_test_clerk')
    vi.stubEnv('CLERK_WEBHOOK_SIGNING_SECRET', 'whsec_clerk')
    vi.stubEnv('DELETION_AUDIT_SECRET', '')
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_stripe')
    vi.stubEnv('STRIPE_LIVEMODE', 'false')
    vi.stubEnv('DURABLE_WORKER_ENABLED', 'true')
    vi.stubEnv('CRON_SECRET', 'cron-secret-0123456789abcdef012345678')

    expect(accountDeletionConfigurationReady()).toBe(false)
    expect(() => assertAccountDeletionConfigurationReady()).toThrow(AccountDeletionConfigurationError)
    expect(() => requireDeletionAuditSecret()).toThrow(AccountDeletionConfigurationError)
  })

  it('requires an exact explicit activation switch', () => {
    vi.stubEnv('CLERK_SECRET_KEY', 'sk_test_clerk')
    vi.stubEnv('CLERK_WEBHOOK_SIGNING_SECRET', 'whsec_clerk')
    vi.stubEnv('DELETION_AUDIT_SECRET', 'audit-secret')
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_stripe')
    vi.stubEnv('STRIPE_LIVEMODE', 'false')
    vi.stubEnv('DURABLE_WORKER_ENABLED', 'true')
    vi.stubEnv('CRON_SECRET', 'cron-secret-0123456789abcdef012345678')
    vi.stubEnv('ACCOUNT_DELETION_ENABLED', 'TRUE')

    expect(accountDeletionEnabled()).toBe(false)
    expect(accountDeletionConfigurationReady()).toBe(false)
    expect(accountDeletionIntakeConfigurationReady()).toBe(false)
    expect(() => assertAccountDeletionEnabled()).toThrow(AccountDeletionConfigurationError)

    vi.stubEnv('ACCOUNT_DELETION_ENABLED', 'true')
    expect(accountDeletionEnabled()).toBe(true)
    expect(accountDeletionConfigurationReady()).toBe(true)
    expect(accountDeletionIntakeConfigurationReady()).toBe(true)
    expect(accountDeletionSelfServiceConfigurationReady()).toBe(true)
  })

  it('requires a configured enabled durable worker before self-service identity deletion', () => {
    vi.stubEnv('ACCOUNT_DELETION_ENABLED', 'true')
    vi.stubEnv('CLERK_SECRET_KEY', 'sk_test_clerk')
    vi.stubEnv('CLERK_WEBHOOK_SIGNING_SECRET', 'whsec_clerk')
    vi.stubEnv('DELETION_AUDIT_SECRET', 'audit-secret')
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_stripe')
    vi.stubEnv('STRIPE_LIVEMODE', 'false')
    vi.stubEnv('CRON_SECRET', 'cron-secret-0123456789abcdef012345678')
    vi.stubEnv('DURABLE_WORKER_ENABLED', 'false')

    expect(accountDeletionConfigurationReady()).toBe(true)
    expect(accountDeletionSelfServiceConfigurationReady()).toBe(false)

    vi.stubEnv('DURABLE_WORKER_ENABLED', 'true')
    expect(accountDeletionSelfServiceConfigurationReady()).toBe(true)
  })

  it('refuses self-service deletion when Stripe cleanup cannot run in the expected mode', () => {
    vi.stubEnv('ACCOUNT_DELETION_ENABLED', 'true')
    vi.stubEnv('CLERK_SECRET_KEY', 'sk_test_clerk')
    vi.stubEnv('CLERK_WEBHOOK_SIGNING_SECRET', 'whsec_clerk')
    vi.stubEnv('DELETION_AUDIT_SECRET', 'audit-secret')
    vi.stubEnv('STRIPE_LIVEMODE', 'true')
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_wrong_mode')

    expect(accountDeletionConfigurationReady()).toBe(false)
    expect(accountDeletionIntakeConfigurationReady()).toBe(true)
  })
})
