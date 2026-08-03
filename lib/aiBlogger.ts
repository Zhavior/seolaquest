import fs from 'fs'
import path from 'path'
import { createHash } from 'node:crypto'
import { calculateReadingTime } from './blog'

export interface GenerateBlogPostOptions {
  topic: string
  tag?: string
  author?: string
  authorRole?: string
  authorAvatar?: string
  apiKey?: string
}

export interface GeneratedBlogResult {
  success: boolean
  slug: string
  title: string
  filePath: string
  readTimeMinutes: number
  message: string
}

/* ─────────────── Utilities ─────────────── */

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100)
}

function safeSlug(text: string): string {
  return slugify(text) || `post-${createHash('sha256').update(text).digest('hex').slice(0, 12)}`
}

/** Map category tag to a cover color and default avatar */
function categoryMeta(tag: string): { coverColor: string; avatar: string } {
  const t = tag.toLowerCase()
  if (t.includes('speed') || t.includes('lead'))
    return { coverColor: '#FFE600', avatar: '⚔️' }
  if (t.includes('mana') || t.includes('api'))
    return { coverColor: '#00FFFF', avatar: '🧪' }
  if (t.includes('guild') || t.includes('lore'))
    return { coverColor: '#FF3333', avatar: '🐉' }
  if (t.includes('saas') || t.includes('growth'))
    return { coverColor: '#8A2BE2', avatar: '📊' }
  return { coverColor: '#FFE600', avatar: '⚡' }
}

/* ─────────────── System Prompt ─────────────── */

const SYSTEM_PROMPT = `You are a Principal Technical Writer and B2B Growth Architect for CoQuest — an arcade-themed, Neo-Brutalist, gamified social listening platform for B2B lead hunters.

WRITING RULES:
- Write 1,200–1,800 words of Markdown body content (no frontmatter — the system adds that).
- Start with an H1 title that includes a relevant emoji prefix.
- Use H2 and H3 sub-headings to structure 3–5 major sections.
- Include at least one TypeScript or CSS code block.
- Include at least one Markdown table comparing metrics, tiers, or strategies.
- Include at least one blockquote with an RPG-character attribution.
- Use horizontal rules (---) between major sections.
- Embed CoQuest lore and RPG language naturally: Mana, XP, Guilds, Bounties, Runes, Hunters.
- End with a strong CTA section linking to /dashboard, /keys, /guild, and /sign-up using Markdown links.
- Tone: sharp, authoritative, tactical. Not salesy or generic.
- Use emojis purposefully in headings (⚔️, 🧪, 🐉, 📊, ⚡, 🔥, 🏆).`

// Generated files are drafts. Reviewers must verify sources and current product
// behavior before explicitly setting `published: true` in frontmatter.

/* ─────────────── LLM Callers ─────────────── */

async function callOpenAI(apiKey: string, topic: string): Promise<string | null> {
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: `Write an in-depth article about: "${topic}". Follow all writing rules exactly.`,
          },
        ],
        temperature: 0.72,
        max_tokens: 4000,
      }),
      signal: AbortSignal.timeout(30_000),
    })

    if (!res.ok) return null
    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>
    }
    return json.choices?.[0]?.message?.content || null
  } catch {
    return null
  }
}

async function callGemini(apiKey: string, topic: string): Promise<string | null> {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `${SYSTEM_PROMPT}\n\n---\n\nWrite an in-depth article about: "${topic}". Follow all writing rules exactly.`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.72,
          maxOutputTokens: 4000,
        },
      }),
      signal: AbortSignal.timeout(30_000),
    })

    if (!res.ok) return null
    const json = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
    }
    return json.candidates?.[0]?.content?.parts?.[0]?.text || null
  } catch {
    return null
  }
}

/* ─────────────── Fallback Template ─────────────── */

function generateFallbackTemplate(topic: string): string {
  return [
    `# Draft: ${topic}`,
    '',
    'This draft was created without a configured language-model provider.',
    '',
    'It contains no product, customer, performance, revenue, security, or availability claims.',
    '',
    '> Editorial review and source verification are required before publication.',
  ].join('\n')
}

/* ─────────────── Main Generator ─────────────── */

/**
 * Generate a comprehensive Neo-Brutalist Arcade Blog Post using LLM or Fallback Template
 */
export async function generateAndSaveBlogPost(
  options: GenerateBlogPostOptions
): Promise<GeneratedBlogResult> {
  const {
    topic,
    tag = '⚔️ SPEED-TO-LEAD',
    author = 'CoQuest Editorial Draft',
    authorRole = 'Unverified draft',
    apiKey,
  } = options

  const slug = safeSlug(topic)
  const dateStr = new Date().toISOString().split('T')[0]
  const { coverColor, avatar } = categoryMeta(tag)
  const authorAvatar = options.authorAvatar || avatar

  const generatedTitle = `⚡ ${topic}`
  const generatedDescription = `Unverified editorial draft about ${topic}. Review evidence and product claims before publication.`

  // Attempt LLM generation
  let markdownBody: string | null = null

  if (apiKey) {
    if (apiKey.startsWith('sk-') || apiKey.startsWith('gsk_')) {
      markdownBody = await callOpenAI(apiKey, topic)
    } else if (apiKey.startsWith('AI') || apiKey.length > 30) {
      // Gemini API keys typically start with 'AI' or are long alphanumeric strings
      markdownBody = await callGemini(apiKey, topic)
    }
  }

  // Try environment keys as fallback
  if (!markdownBody) {
    const envOpenAI = process.env.OPENAI_API_KEY
    const envGemini = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY
    if (envOpenAI) {
      markdownBody = await callOpenAI(envOpenAI, topic)
    }
    if (!markdownBody && envGemini) {
      markdownBody = await callGemini(envGemini, topic)
    }
  }

  // Final fallback: structured template
  if (!markdownBody) {
    markdownBody = generateFallbackTemplate(topic)
  }

  const readTimeMinutes = calculateReadingTime(markdownBody)

  const mdxFileContent = `---
title: "${generatedTitle.replace(/"/g, '\\"')}"
slug: "${slug}"
description: "${generatedDescription.replace(/"/g, '\\"')}"
date: "${dateStr}"
author: "${author}"
authorRole: "${authorRole}"
authorAvatar: "${authorAvatar}"
tag: "${tag}"
published: false
featured: false
coverColor: "${coverColor}"
readTimeMinutes: ${readTimeMinutes}
---

${markdownBody}
`

  const postsDir = path.join(process.cwd(), 'content', 'posts')
  if (!fs.existsSync(postsDir)) {
    fs.mkdirSync(postsDir, { recursive: true })
  }

  const filePath = path.join(postsDir, `${slug}.mdx`)
  // Never let a repeated/generated slug silently replace already-published content.
  fs.writeFileSync(filePath, mdxFileContent, { encoding: 'utf8', flag: 'wx' })

  return {
    success: true,
    slug,
    title: generatedTitle,
    filePath,
    readTimeMinutes,
    message: `Draft "${generatedTitle}" saved for review. It is not published.`,
  }
}

