import { NextResponse } from 'next/server'

let mockKeywords = [
  { id: 'kw_1', phrase: 'need a web designer', heroClass: 'Warrior 🥷', platform: 'Reddit & Twitter', status: 'Active', matchesFound: 42 },
  { id: 'kw_2', phrase: 'Mention alternative', heroClass: 'Mage 🧙‍♂️', platform: 'Reddit', status: 'Active', matchesFound: 18 },
  { id: 'kw_3', phrase: 'looking for Next.js dev', heroClass: 'Knight 🦸‍♂️', platform: 'Twitter', status: 'Paused', matchesFound: 9 }
]

export async function GET() {
  return NextResponse.json({ success: true, keywords: mockKeywords })
}

export async function POST(req: Request) {
  try {
    const { phrase, heroClass, platform } = await req.json()
    if (!phrase) return NextResponse.json({ error: 'Phrase required' }, { status: 400 })

    const newKeyword = {
      id: `kw_${Date.now()}`,
      phrase,
      heroClass: heroClass || 'Warrior 🥷',
      platform: platform || 'Reddit & Twitter',
      status: 'Active',
      matchesFound: 0
    }

    mockKeywords.push(newKeyword)
    return NextResponse.json({ success: true, keyword: newKeyword })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add keyword' }, { status: 500 })
  }
}
