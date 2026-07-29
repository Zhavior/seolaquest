'use server'

import { LeadStatus } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import Stripe from 'stripe'
import prisma from '@/lib/prisma'
import { requireCurrentUser } from '@/lib/auth'

type ActionResult = { ok: boolean; message?: string }

type CheckoutPlan = 'BETA' | 'PRO' | 'AGENCY'

const stripePriceByPlan: Record<CheckoutPlan, string | undefined> = {
  BETA: process.env.STRIPE_PRICE_BETA,
  PRO: process.env.STRIPE_PRICE_PRO,
  AGENCY: process.env.STRIPE_PRICE_AGENCY,
}

function cleanText(value: string, maxLength: number) {
  return value.replace(/\s+/g, ' ').trim().slice(0, maxLength)
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase()
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export async function signUpAction(input: { email: string; password: string }): Promise<ActionResult> {
  const email = normalizeEmail(input.email)
  if (!isValidEmail(email)) return { ok: false, message: 'Enter a valid email address.' }
  if (input.password.length < 8) return { ok: false, message: 'Use a password with at least 8 characters.' }
  if (input.password.length > 72) return { ok: false, message: 'Use a password with 72 characters or fewer.' }

  const existingUser = await prisma.user.findUnique({ where: { email }, select: { id: true } })
  if (existingUser) return { ok: false, message: 'An account already exists for this email. Sign in instead.' }

  const passwordHash = input.password + "_hash"
  await prisma.user.create({ data: { email, passwordHash } })
  return { ok: true }
}

export async function createCheckoutAction(plan: CheckoutPlan): Promise<ActionResult & { url?: string }> {
  const user = await requireCurrentUser()
  const stripeKey = process.env.STRIPE_SECRET_KEY
  const priceId = stripePriceByPlan[plan]
  const siteUrl = process.env.NEXTAUTH_URL

  if (!stripeKey || !priceId || !siteUrl) {
    return { ok: false, message: 'Checkout is not configured yet. Add the Stripe price IDs in Vercel first.' }
  }

  const stripe = new Stripe(stripeKey)
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: user.stripeCustomerId ?? undefined,
    customer_email: user.stripeCustomerId ? undefined : user.email ?? undefined,
    client_reference_id: user.id,
    metadata: { userId: user.id, plan },
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${siteUrl}/billing?checkout=success`,
    cancel_url: `${siteUrl}/billing?checkout=cancelled`,
  })

  if (!session.url) return { ok: false, message: 'Stripe did not return a checkout link. Try again.' }
  return { ok: true, url: session.url }
}

type PotionId = 'minor_vial' | 'greater_elixir' | 'dragon_cauldron'

const POTION_DETAILS = {
  minor_vial: { name: 'Minor Mana Vial', priceCents: 500, quests: 1000 },
  greater_elixir: { name: 'Greater Mana Elixir', priceCents: 1000, quests: 2500 },
  dragon_cauldron: { name: "Dragon's Cauldron", priceCents: 2000, quests: 6000 },
}

export async function createManaCheckoutAction(potionId: string): Promise<ActionResult & { url?: string }> {
  const user = await requireCurrentUser()
  const stripeKey = process.env.STRIPE_SECRET_KEY
  const siteUrl = process.env.NEXTAUTH_URL
  const potion = POTION_DETAILS[potionId as PotionId]

  if (!stripeKey || !siteUrl || !potion) {
    return { ok: false, message: 'Checkout is not configured or invalid item.' }
  }

  const stripe = new Stripe(stripeKey)
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer: user.stripeCustomerId ?? undefined,
    customer_email: user.stripeCustomerId ? undefined : user.email ?? undefined,
    client_reference_id: user.id,
    metadata: { userId: user.id, type: 'mana_potion', potionId, quests: potion.quests.toString() },
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: potion.name,
          },
          unit_amount: potion.priceCents,
        },
        quantity: 1,
      },
    ],
    success_url: `${siteUrl}?checkout=success&potion=${potionId}`,
    cancel_url: `${siteUrl}?checkout=cancelled`,
  })

  if (!session.url) return { ok: false, message: 'Stripe did not return a checkout link. Try again.' }
  return { ok: true, url: session.url }
}

function levelAfterClaim(user: { xp: number; level: number; xpRequired: number }) {
  const nextXp = user.xp + 150
  const leveledUp = nextXp >= user.xpRequired

  return {
    xp: nextXp,
    level: leveledUp ? user.level + 1 : user.level,
    xpRequired: leveledUp ? Math.round(user.xpRequired * 1.5) : user.xpRequired,
  }
}

export async function addKeywordAction(phrase: string): Promise<ActionResult> {
  const user = await requireCurrentUser()
  const cleanedPhrase = cleanText(phrase, 80)

  if (cleanedPhrase.length < 3) return { ok: false, message: 'Use at least 3 characters for a keyword.' }

  try {
    await prisma.trackedKeyword.create({ data: { userId: user.id, phrase: cleanedPhrase } })
  } catch {
    return { ok: false, message: 'That keyword is already being tracked.' }
  }

  revalidatePath('/')
  return { ok: true }
}

export async function removeKeywordAction(keywordId: string): Promise<ActionResult> {
  const user = await requireCurrentUser()
  const deleted = await prisma.trackedKeyword.deleteMany({ where: { id: keywordId, userId: user.id } })

  if (!deleted.count) return { ok: false, message: 'Keyword not found.' }

  revalidatePath('/')
  return { ok: true }
}

export async function claimQuestAction(leadId: string): Promise<ActionResult & { user?: { xp: number; level: number; xpRequired: number } }> {
  const user = await requireCurrentUser()
  const lead = await prisma.lead.findFirst({
    where: { id: leadId, userId: user.id, status: { in: [LeadStatus.NEW, LeadStatus.VIEWED] } },
    select: { id: true },
  })

  if (!lead) return { ok: false, message: 'This quest is no longer available.' }

  const updatedUser = await prisma.$transaction(async (tx) => {
    const freshUser = await tx.user.findUniqueOrThrow({
      where: { id: user.id },
      select: { xp: true, level: true, xpRequired: true },
    })
    const next = levelAfterClaim(freshUser)

    await tx.lead.update({
      where: { id: lead.id },
      data: { status: LeadStatus.CONTACTED, claimedAt: new Date(), contactedAt: new Date() },
    })

    return tx.user.update({
      where: { id: user.id },
      data: next,
      select: { xp: true, level: true, xpRequired: true },
    })
  })

  revalidatePath('/')
  return { ok: true, user: updatedUser }
}

export async function dismissLeadAction(leadId: string): Promise<ActionResult> {
  const user = await requireCurrentUser()
  const updated = await prisma.lead.updateMany({
    where: { id: leadId, userId: user.id, status: { in: [LeadStatus.NEW, LeadStatus.VIEWED] } },
    data: { status: LeadStatus.DISMISSED, dismissedAt: new Date() },
  })

  if (!updated.count) return { ok: false, message: 'This quest is no longer available.' }
  revalidatePath('/')
  return { ok: true }
}

export async function scanForLeadsAction(): Promise<ActionResult & { created?: number }> {
  const user = await requireCurrentUser()
  const keywords = await prisma.trackedKeyword.findMany({
    where: { userId: user.id, active: true },
    orderBy: { createdAt: 'asc' },
    take: 10,
  })

  if (!keywords.length) return { ok: false, message: 'Add a keyword before scanning.' }

  let created = 0

  for (const keyword of keywords) {
    try {
      const query = encodeURIComponent(keyword.phrase)

      // 1. Reddit Search (Public JSON API)
      const response = await fetch(`https://www.reddit.com/search.json?q=${query}&type=link&sort=new&limit=10`, {
        cache: 'no-store',
        headers: { 'User-Agent': 'HypeQuest/1.0 social-listening MVP' },
      })

      if (response.ok) {
        const json = (await response.json()) as { data?: { children?: Array<{ data?: Record<string, unknown> }> } }
        const children = json.data?.children ?? []

        for (const child of children) {
          const post = child.data
          if (!post) continue
          const postId = typeof post?.name === 'string' ? post.name : null
          const permalink = typeof post?.permalink === 'string' ? post.permalink : null
          if (!postId || !permalink) continue

          const title = typeof post.title === 'string' ? post.title : ''
          const body = typeof post.selftext === 'string' ? post.selftext : ''
          const content = cleanText(`${title} ${body}`, 700)
          if (!content) continue

          const author = typeof post.author === 'string' ? `u/${post.author}` : 'u/[deleted]'
          const createdUtc = typeof post.created_utc === 'number' ? new Date(post.created_utc * 1000) : null

          const existing = await prisma.lead.findUnique({
            where: { userId_externalPostId: { userId: user.id, externalPostId: postId } },
            select: { id: true },
          })

          if (!existing) {
            await prisma.lead.create({
              data: {
                userId: user.id,
                keywordId: keyword.id,
                platform: 'REDDIT',
                externalPostId: postId,
                author,
                content,
                matched: keyword.phrase,
                url: `https://www.reddit.com${permalink}`,
                sourceCreatedAt: createdUtc,
              },
            })
            created += 1
          }
        }
      }

      // 2. Twitter / X API (Activated automatically if TWITTER_BEARER_TOKEN is provided)
      const twitterToken = process.env.TWITTER_BEARER_TOKEN
      if (twitterToken) {
        const tweetRes = await fetch(
          `https://api.twitter.com/2/tweets/search/recent?query=${query}&max_results=10&tweet.fields=created_at,author_id`,
          {
            cache: 'no-store',
            headers: { Authorization: `Bearer ${twitterToken}` },
          },
        )
        if (tweetRes.ok) {
          const tweetJson = (await tweetRes.json()) as { data?: Array<{ id: string; text: string; created_at?: string }> }
          const tweets = tweetJson.data ?? []

          for (const tweet of tweets) {
            const existing = await prisma.lead.findUnique({
              where: { userId_externalPostId: { userId: user.id, externalPostId: `tw_${tweet.id}` } },
              select: { id: true },
            })

            if (!existing) {
              await prisma.lead.create({
                data: {
                  userId: user.id,
                  keywordId: keyword.id,
                  platform: 'TWITTER',
                  externalPostId: `tw_${tweet.id}`,
                  author: '@social_user',
                  content: cleanText(tweet.text, 500),
                  matched: keyword.phrase,
                  url: `https://x.com/i/web/status/${tweet.id}`,
                  sourceCreatedAt: tweet.created_at ? new Date(tweet.created_at) : new Date(),
                },
              })
              created += 1
            }
          }
        }
      }
    } catch {
      // A single unavailable source must not stop other keywords.
    }
  }

  revalidatePath('/')
  return { ok: true, created, message: created ? undefined : 'Scan complete. No new social posts found.' }
}

export async function createPostAction(content: string): Promise<ActionResult> {
  const user = await requireCurrentUser()
  const cleanedContent = cleanText(content, 500)
  if (!cleanedContent) return { ok: false, message: 'Write something before posting.' }

  await prisma.post.create({ data: { userId: user.id, content: cleanedContent } })
  revalidatePath('/profile')
  return { ok: true }
}

export async function deletePostAction(id: string): Promise<ActionResult> {
  const user = await requireCurrentUser()
  const deleted = await prisma.post.deleteMany({ where: { id, userId: user.id } })
  if (!deleted.count) return { ok: false, message: 'Post not found.' }

  revalidatePath('/profile')
  return { ok: true }
}

export async function completeOnboardingAction(name: string, title: string): Promise<ActionResult> {
  const user = await requireCurrentUser()
  const cleanName = cleanText(name, 60)
  const cleanTitle = cleanText(title, 60)
  if (!cleanName) return { ok: false, message: 'Add a display name to continue.' }

  await prisma.user.update({
    where: { id: user.id },
    data: { name: cleanName, title: cleanTitle || 'Lead Hunter', onboardingComplete: true },
  })
  revalidatePath('/')
  return { ok: true }
}

export async function updateSettingsAction(input: { name: string; title: string; emailDigest: boolean; radarAlerts: boolean; crmWebhookUrl?: string }): Promise<ActionResult> {
  const user = await requireCurrentUser()
  const name = cleanText(input.name, 60)
  const title = cleanText(input.title, 60)
  if (!name) return { ok: false, message: 'Display name cannot be empty.' }

  await prisma.user.update({
    where: { id: user.id },
    data: { name, title: title || 'Lead Hunter', emailDigest: input.emailDigest, radarAlerts: input.radarAlerts, crmWebhookUrl: input.crmWebhookUrl },
  })
  revalidatePath('/settings')
  return { ok: true }
}

export async function getAnalyticsAction() {
  const user = await requireCurrentUser()
  
  // Calculate the last 7 days
  const days = []
  const now = new Date()
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    d.setHours(0, 0, 0, 0)
    days.push(d)
  }

  // Fetch claimed leads in the last 7 days
  const leads = await prisma.lead.findMany({
    where: {
      userId: user.id,
      status: { in: [LeadStatus.CONTACTED, LeadStatus.DISMISSED] },
      OR: [
        { contactedAt: { gte: days[0] } },
        { dismissedAt: { gte: days[0] } }
      ]
    },
    select: { status: true, contactedAt: true, dismissedAt: true }
  })

  // Format response
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const analytics = days.map((date) => {
    const dayStart = date.getTime()
    const dayEnd = dayStart + 24 * 60 * 60 * 1000
    
    const dayLeads = leads.filter(l => {
      const t = l.status === LeadStatus.CONTACTED ? l.contactedAt?.getTime() : l.dismissedAt?.getTime()
      if (!t) return false;
      return t >= dayStart && t < dayEnd
    })

    return {
      day: dayNames[date.getDay()],
      claimed: dayLeads.filter(l => l.status === LeadStatus.CONTACTED).length,
      dismissed: dayLeads.filter(l => l.status === LeadStatus.DISMISSED).length,
    }
  })

  return analytics
}

export async function getLeaderboardAction() {
  const topUsers = await prisma.user.findMany({
    orderBy: { xp: 'desc' },
    take: 5,
    select: { name: true, title: true, level: true, xp: true }
  })
  return topUsers
}

export async function generateAIReplyAction(leadId: string): Promise<ActionResult & { reply?: string }> {
  const user = await requireCurrentUser()
  if (user.level < 5) return { ok: false, message: 'You must be Level 5 to use the AI Alchemist.' }

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: { keyword: true }
  })

  if (!lead) return { ok: false, message: 'Lead not found.' }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return { ok: false, message: 'OpenAI API key is missing. Please configure OPENAI_API_KEY.' }
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { 
            role: 'system', 
            content: 'You are a helpful, conversational social media manager. Your goal is to draft a very short, friendly, and helpful reply to a Reddit post. Subtly offer advice or introduce a relevant tool based on the tracked keyword. Keep it under 3 sentences.' 
          },
          { 
            role: 'user', 
            content: `Author: ${lead.author}\nKeyword Matched: ${lead.keyword.phrase}\nPost Content: ${lead.content}\n\nDraft a short, natural reply:` 
          }
        ]
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    const data = await response.json()
    const reply = data.choices?.[0]?.message?.content?.trim() || 'Sorry, I could not generate a reply.'
    
    await prisma.user.update({
      where: { id: user.id },
      data: { spellsCast: { increment: 1 } }
    })
    
    return { ok: true, reply }
  } catch (error: any) {
    return { ok: false, message: error.message || 'Failed to generate AI reply.' }
  }
}

export async function exportToCrmAction(leadId: string): Promise<ActionResult> {
  const user = await requireCurrentUser()
  if (user.level < 10) return { ok: false, message: 'You must be Level 10 to use CRM Webhooks.' }
  
  if (!user.crmWebhookUrl) {
    return { ok: false, message: 'No CRM Webhook URL configured. Please add one in Settings.' }
  }

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: { keyword: true }
  })

  if (!lead) return { ok: false, message: 'Lead not found.' }

  try {
    const response = await fetch(user.crmWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: lead.id,
        platform: lead.platform,
        author: lead.author,
        content: lead.content,
        url: lead.url,
        keyword: lead.keyword.phrase,
        status: lead.status,
        createdAt: lead.createdAt
      })
    })

    if (!response.ok) {
      throw new Error(`Webhook responded with status ${response.status}`)
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { questsExported: { increment: 1 } }
    })

    return { ok: true, message: 'Lead successfully exported to your CRM!' }
  } catch (error: any) {
    return { ok: false, message: `Failed to export lead: ${error.message}` }
  }
}

export async function getGuildStatsAction() {
  const user = await requireCurrentUser()
  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
  
  const totalKeywords = await prisma.trackedKeyword.count({
    where: { userId: user.id }
  })

  const monstersDefeated = await prisma.lead.count({
    where: { userId: user.id, status: { in: ['CONTACTED', 'DISMISSED'] } }
  })

  const contactedLeads = await prisma.lead.findMany({
    where: { userId: user.id, status: 'CONTACTED' },
    include: { keyword: true }
  })
  
  const keywordCounts: Record<string, { phrase: string, count: number, platform: string }> = {}
  for (const lead of contactedLeads) {
    if (!keywordCounts[lead.keywordId]) {
      keywordCounts[lead.keywordId] = { phrase: lead.keyword.phrase, count: 0, platform: lead.platform }
    }
    keywordCounts[lead.keywordId].count++
  }
  
  let deadliestWeapon = { phrase: 'looking for CRM', count: 142, artifactName: "Excalibur of Reddit: 'looking for CRM'", platform: 'Reddit' }
  if (Object.keys(keywordCounts).length > 0) {
    let topCount = -1
    for (const k in keywordCounts) {
      if (keywordCounts[k].count > topCount) {
        topCount = keywordCounts[k].count
        const kw = keywordCounts[k]
        let artifactName = `Excalibur of Reddit: '${kw.phrase}'`
        if (kw.platform.toUpperCase().includes('TWITTER') || kw.platform.toUpperCase().includes('X')) {
          artifactName = `Mjolnir of Twitter: '${kw.phrase}'`
        } else if (kw.platform.toUpperCase().includes('LINKEDIN')) {
          artifactName = `Aegis of LinkedIn: '${kw.phrase}'`
        }
        deadliestWeapon = { phrase: kw.phrase, count: kw.count, artifactName, platform: kw.platform }
      }
    }
  }

  // Channel distribution
  const platformGroups = await prisma.lead.groupBy({
    by: ['platform'],
    where: { userId: user.id },
    _count: { id: true }
  })

  const totalLeadsCount = platformGroups.reduce((acc, curr) => acc + curr._count.id, 0)
  
  let channels = [
    { name: 'r/SaaS (Reddit)', percent: 60, color: '#FF5722' },
    { name: 'X / Twitter', percent: 30, color: '#06B6D4' },
    { name: 'r/webdev', percent: 10, color: '#A3E635' }
  ]

  if (totalLeadsCount > 0) {
    channels = platformGroups.map(p => {
      const pct = Math.round((p._count.id / totalLeadsCount) * 100)
      let color = '#FF5722'
      let name = p.platform
      if (p.platform.toUpperCase().includes('REDDIT')) {
        color = '#FF5722'
        name = 'r/SaaS (Reddit)'
      } else if (p.platform.toUpperCase().includes('TWITTER') || p.platform.toUpperCase().includes('X')) {
        color = '#06B6D4'
        name = 'X / Twitter'
      } else if (p.platform.toUpperCase().includes('LINKEDIN')) {
        color = '#A3E635'
        name = 'LinkedIn'
      }
      return { name, percent: pct, color }
    })
  }

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  
  const recentLeads = await prisma.lead.findMany({
    where: { userId: user.id, status: { in: ['CONTACTED', 'DISMISSED'] }, claimedAt: { gte: thirtyDaysAgo } },
    select: { claimedAt: true }
  })

  const heatmapDetails: Record<string, { count: number, autoReplies: number }> = {}
  for (const lead of recentLeads) {
    if (lead.claimedAt) {
      const dateStr = lead.claimedAt.toISOString().split('T')[0]
      if (!heatmapDetails[dateStr]) {
        heatmapDetails[dateStr] = { count: 0, autoReplies: 0 }
      }
      heatmapDetails[dateStr].count += 1
      if (heatmapDetails[dateStr].count % 2 === 0) {
        heatmapDetails[dateStr].autoReplies += 1
      }
    }
  }

  let streak = 0
  const today = new Date()
  for (let i = 0; i < 30; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dStr = d.toISOString().split('T')[0]
    if (heatmapDetails[dStr] && heatmapDetails[dStr].count > 0) {
      streak++
    } else if (i === 0) {
      continue
    } else {
      break
    }
  }
  const activeStreak = streak > 0 ? streak : 14

  const spellsCast = dbUser?.spellsCast || 0
  const questsExported = dbUser?.questsExported || 0
  const conversionRate = monstersDefeated > 0 ? Number(((contactedLeads.length / monstersDefeated) * 100).toFixed(1)) : 14.5
  const criticalHitRate = conversionRate > 0 ? Number((conversionRate * 1.25).toFixed(1)) : 18.4

  const userLevel = dbUser?.level || 5
  const userXp = dbUser?.xp || 0
  const userXpRequired = dbUser?.xpRequired || 100

  const monsterLevelTargets = [10, 25, 50, 100, 250, 500, 1000]
  const nextMonsterTarget = monsterLevelTargets.find(t => t > monstersDefeated) || monstersDefeated + 50

  return {
    monstersDefeated,
    spellsCast,
    questsExported,
    deadliestWeapon,
    heatmapDetails,
    conversionRate,
    criticalHitRate,
    topChannel: channels[0]?.name || 'r/SaaS',
    channels,
    scoutSpeed: '< 3 mins',
    manaEfficiency: Math.min(99, Math.max(78, 85 + Math.round(spellsCast * 0.4))),
    manaPerReply: 0.4,
    huntingStreak: activeStreak,
    level: userLevel,
    xp: userXp,
    xpRequired: userXpRequired,
    nextMonsterTarget,
    totalKeywords,
    achievements: [
      {
        id: 'first_blood',
        tier: 'bronze',
        badge: '🥉',
        title: 'First Blood',
        description: 'Deploy your first Keyword Scout',
        unlocked: totalKeywords > 0 || monstersDefeated > 0,
        progress: totalKeywords > 0 || monstersDefeated > 0 ? 1 : 0,
        target: 1,
      },
      {
        id: 'bounty_hunter',
        tier: 'silver',
        badge: '🥈',
        title: 'Bounty Hunter',
        description: 'Defeat 100 Monsters (Process 100 Leads)',
        unlocked: monstersDefeated >= 100,
        progress: Math.min(monstersDefeated, 100),
        target: 100,
      },
      {
        id: 'archmage',
        tier: 'gold',
        badge: '🥇',
        title: 'Archmage',
        description: 'Cast 50 Auto-Replies with >10% Conversion Rate',
        unlocked: spellsCast >= 50 && conversionRate >= 10,
        progress: Math.min(spellsCast, 50),
        target: 50,
      },
      {
        id: 'dragon_slayer',
        tier: 'diamond',
        badge: '💎',
        title: 'Dragon Slayer',
        description: 'Close a high-ticket enterprise bounty (Export to CRM)',
        unlocked: questsExported >= 1,
        progress: Math.min(questsExported, 1),
        target: 1,
      },
    ]
  }
}
