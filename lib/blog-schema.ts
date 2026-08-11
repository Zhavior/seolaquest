import type { Post } from './blog-types'
import { absoluteUrl } from './siteUrl'

/**
 * Structured data for blog posts.
 *
 * Google will only show an FAQ rich result when the question and answer text in
 * the JSON-LD is identical to the text a visitor can read on the page, so both
 * schemas here are derived from the rendered post content rather than
 * hand-written alongside it. A hand-maintained copy drifts the first time
 * someone edits the MDX, and a drifted FAQPage is a manual-action risk.
 */

export interface FaqEntry {
  question: string
  answer: string
}

/** Strip inline markdown so the schema carries the same plain text the reader sees. */
function toPlainText(markdown: string): string {
  return markdown
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*\n]+)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Pull the H3 question/answer pairs out of the post's FAQ section.
 *
 * Scoped to the FAQ H2 on purpose: every other H3 in these articles is an
 * implementation heading, and marking those up as questions would be a
 * misrepresentation of the page.
 */
export function extractFaqEntries(content: string): FaqEntry[] {
  const faqSection = /^##\s+.*\bFAQ\b.*$/im.exec(content)
  if (!faqSection) return []

  const start = faqSection.index + faqSection[0].length
  const rest = content.slice(start)

  // The FAQ block ends at the next H2 (or H1), whichever comes first.
  const nextTopLevel = /^#{1,2}\s+/m.exec(rest)
  const block = nextTopLevel ? rest.slice(0, nextTopLevel.index) : rest

  const entries: FaqEntry[] = []
  const questionRegex = /^###\s+(.+)$/gm
  let match: RegExpExecArray | null

  while ((match = questionRegex.exec(block)) !== null) {
    const question = toPlainText(match[1])
    const answerStart = match.index + match[0].length
    const following = block.slice(answerStart)
    const nextQuestion = /^###\s+/m.exec(following)
    const answer = toPlainText(nextQuestion ? following.slice(0, nextQuestion.index) : following)

    if (question && answer) entries.push({ question, answer })
  }

  return entries
}

export function buildArticleSchema(post: Post) {
  const url = absoluteUrl(`/blog/${post.slug}`)

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    datePublished: post.date,
    dateModified: post.date,
    author: {
      '@type': 'Person',
      name: post.author,
      jobTitle: post.authorRole,
    },
    publisher: {
      '@type': 'Organization',
      name: 'SEOlaQuest',
      url: absoluteUrl('/'),
    },
    articleSection: post.tag,
    wordCount: post.content.split(/\s+/).filter(Boolean).length,
    inLanguage: 'en',
  }
}

export function buildFaqSchema(entries: FaqEntry[]) {
  if (entries.length === 0) return null

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: entries.map((entry) => ({
      '@type': 'Question',
      name: entry.question,
      acceptedAnswer: { '@type': 'Answer', text: entry.answer },
    })),
  }
}
