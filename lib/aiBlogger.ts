import fs from 'fs'
import path from 'path'
import { createHash } from 'node:crypto'
import { calculateReadingTime } from './blog'
import { CLAUDE_REFUSAL_FALLBACK, CLAUDE_SMART_MODEL, claudeText, getClaudeClient } from './anthropic'

export interface GenerateBlogPostOptions {
  topic: string
  tag?: string
  author?: string
  authorRole?: string
  authorAvatar?: string
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

const SYSTEM_PROMPT = `You are a Principal Technical Writer and B2B Growth Architect for SEOlaQuest — an arcade-themed, Neo-Brutalist, gamified social listening platform for B2B lead hunters.

WRITING RULES:
- Write 1,200–1,800 words of Markdown body content (no frontmatter — the system adds that).
- Start with an H1 title that includes a relevant emoji prefix.
- Use H2 and H3 sub-headings to structure 3–5 major sections.
- Include at least one TypeScript or CSS code block.
- Include at least one Markdown table comparing metrics, tiers, or strategies.
- Include at least one blockquote with an RPG-character attribution.
- Use horizontal rules (---) between major sections.
- Embed SEOlaQuest lore and RPG language naturally: Mana, XP, Guilds, Bounties, Runes, Hunters.
- End with a strong CTA section linking to /dashboard, /keys, /guild, and /sign-up using Markdown links.
- Tone: sharp, authoritative, tactical. Not salesy or generic.
- Use emojis purposefully in headings (⚔️, 🧪, 🐉, 📊, ⚡, 🔥, 🏆).`

// Generated files are drafts. Reviewers must verify sources and current product
// behavior before explicitly setting `published: true` in frontmatter.

/* ─────────────── LLM Callers ─────────────── */

async function callClaude(topic: string): Promise<string | null> {
  const client = getClaudeClient()
  if (!client) return null
  try {
    const response = await client.beta.messages.create(
      {
        model: CLAUDE_SMART_MODEL,
        max_tokens: 16000,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: `Write an in-depth article about: "${topic}". Follow all writing rules exactly.`,
          },
        ],
        output_config: { effort: 'medium' },
        ...CLAUDE_REFUSAL_FALLBACK,
      },
      { timeout: 120_000 },
    )
    return claudeText(response) || null
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
    author = 'SEOlaQuest Editorial Draft',
    authorRole = 'Unverified draft',
  } = options

  const slug = safeSlug(topic)
  const dateStr = new Date().toISOString().split('T')[0]
  const { coverColor, avatar } = categoryMeta(tag)
  const authorAvatar = options.authorAvatar || avatar

  const generatedTitle = `⚡ ${topic}`
  const generatedDescription = `Unverified editorial draft about ${topic}. Review evidence and product claims before publication.`

  // Without Claude the draft is the claim-free template, never invented copy.
  const markdownBody = (await callClaude(topic)) ?? generateFallbackTemplate(topic)

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

