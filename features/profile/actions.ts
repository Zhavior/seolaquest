'use server'

import { auth, clerkClient, reverificationError } from '@clerk/nextjs/server'
import {
  ACCOUNT_DELETION_CONFIRMATION,
  accountDeletionSelfServiceConfigurationReady,
} from '@/src/modules/lifecycle/domain/accountDeletion'

type ActionResult = { ok: boolean; message?: string }

export async function updateSettingsAction(input: { name: string; title: string; emailDigest: boolean; radarAlerts: boolean; crmWebhookUrl?: string }): Promise<ActionResult> {
  const { UserService } = await import('@/src/modules/users/application/UserService')
  return UserService.updateSettings(input)
}

export async function submitBugReportAction(input: { category: string; severity: string; description: string }): Promise<ActionResult> {
  const { FeedbackService } = await import('@/src/modules/feedback/application/FeedbackService')
  return FeedbackService.submitBugReport(input)
}

export async function submitFeedbackScrollAction(input: { title: string; category: string; description: string }): Promise<ActionResult> {
  const { FeedbackService } = await import('@/src/modules/feedback/application/FeedbackService')
  return FeedbackService.submitFeedbackScroll(input)
}

export async function deleteAccountAction(confirmation: string) {
  const session = await auth.protect()

  if (confirmation !== ACCOUNT_DELETION_CONFIRMATION) {
    return { ok: false, message: `Type ${ACCOUNT_DELETION_CONFIRMATION} exactly to continue.` }
  }
  if (!session.has({ reverification: 'strict' })) {
    return reverificationError('strict')
  }
  if (!accountDeletionSelfServiceConfigurationReady()) {
    return { ok: false, message: 'Account deletion is temporarily unavailable. No data was deleted.' }
  }

  const { AccountDeletionService } = await import(
    '@/src/modules/lifecycle/application/AccountDeletionService'
  )
  let prepared: Awaited<ReturnType<typeof AccountDeletionService.prepareSelfServiceDeletion>>
  try {
    prepared = await AccountDeletionService.prepareSelfServiceDeletion(session.userId)
  } catch {
    return {
      ok: false,
      message: 'Account deletion could not be prepared safely. No identity deletion was requested.',
    }
  }

  if (prepared.alreadyAccepted) {
    return {
      ok: true,
      message: 'Account deletion is already accepted and local cleanup is pending.',
    }
  }
  if ('pendingCheckout' in prepared && prepared.pendingCheckout) {
    return {
      ok: false,
      message: 'Account deletion is blocked while a Stripe Checkout is pending. Finish or cancel it, then wait for payment verification before trying again.',
    }
  }

  try {
    const client = await clerkClient()
    await client.users.deleteUser(session.userId)
  } catch {
    // Clerk client errors do not prove the provider rejected the operation: a
    // network failure can arrive after Clerk committed deletion. Keep the
    // durable freeze until a signed event or reviewed operator action resolves
    // the outcome, preventing new charges for a possibly deleted identity.
    return {
      ok: false,
      message: 'Identity deletion was not confirmed. Billing remains frozen while deletion state is reconciled.',
    }
  }

  try {
    await AccountDeletionService.promoteSelfServiceDeletion(session.userId)
  } catch {
    // Clerk accepted the destructive operation. Keep the prepared freeze in
    // place; the signed user.deleted delivery can safely promote it later.
  }

  return {
    ok: true,
    message: 'Identity deletion accepted. Billing is frozen and local cleanup is pending verified processing.',
  }
}
