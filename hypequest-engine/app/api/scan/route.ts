import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { keywords } = await req.json()
    
    // High-intent leads discovered by Hero Agents
    const mockLeads = [
      {
        id: `q_${Date.now()}_1`,
        platform: 'Reddit',
        source: 'r/SaaS',
        author: 'u/tech_founder99',
        content: 'Does anyone know a good social listening tool for startups under $50/mo? Brandwatch is way too expensive.',
        intentScore: 98,
        xpReward: 150,
        estimatedValue: '$250/mo',
        timeAgo: 'Just now',
        url: 'https://reddit.com'
      },
      {
        id: `q_${Date.now()}_2`,
        platform: 'Twitter',
        source: '@dev_sarah',
        author: '@dev_sarah',
        content: 'Urgently looking for a freelance Next.js developer to build a gamified SaaS dashboard! DM portfolio.',
        intentScore: 94,
        xpReward: 200,
        estimatedValue: '$1,500 project',
        timeAgo: '2m ago',
        url: 'https://x.com'
      },
      {
        id: `q_${Date.now()}_3`,
        platform: 'Reddit',
        source: 'r/Entrepreneur',
        author: 'u/growth_guy',
        content: 'How are you guys tracking brand mentions on X automatically without paying $500/month?',
        intentScore: 91,
        xpReward: 120,
        estimatedValue: '$100/mo',
        timeAgo: '5m ago',
        url: 'https://reddit.com'
      }
    ]

    return NextResponse.json({
      success: true,
      questsFound: mockLeads,
      creditsDeducted: 3
    })
  } catch (error) {
    return NextResponse.json({ error: 'Scan failed' }, { status: 500 })
  }
}
