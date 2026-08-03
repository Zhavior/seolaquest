import { verifyWebhook } from '@clerk/nextjs/webhooks'
import type { NextRequest } from 'next/server'
import { AccountDeletionService } from '@/src/modules/lifecycle/application/AccountDeletionService'
import { accountDeletionIntakeConfigurationReady } from '@/src/modules/lifecycle/domain/accountDeletion'

export async function POST(request: NextRequest) {
  if (!accountDeletionIntakeConfigurationReady()) {
    return new Response('Clerk lifecycle webhook is not configured', { status: 503 })
  }

  const eventId = request.headers.get('svix-id')?.trim()
  if (!eventId) return new Response('Missing webhook delivery ID', { status: 400 })

  let event: Awaited<ReturnType<typeof verifyWebhook>>
  try {
    // verifyWebhook must receive the untouched Request so it can verify the raw body.
    event = await verifyWebhook(request)
  } catch {
    return new Response('Invalid Clerk webhook signature', { status: 400 })
  }

  if (event.type !== 'user.deleted') {
    return new Response('Event ignored', { status: 200 })
  }
  const clerkUserId = event.data.id?.trim()
  if (!clerkUserId) return new Response('Invalid user deletion event', { status: 400 })

  try {
    const result = await AccountDeletionService.acceptClerkUserDeleted({
      eventId,
      eventType: event.type,
      clerkUserId,
    })
    return new Response(result.duplicate ? 'Event already accepted' : 'Deletion accepted', {
      status: 200,
    })
  } catch {
    return new Response('Lifecycle event persistence failed', { status: 500 })
  }
}
