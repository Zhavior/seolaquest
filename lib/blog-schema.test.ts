import { describe, expect, it } from 'vitest'
import { getPostBySlug } from './blog'
import { buildArticleSchema, buildFaqSchema, extractFaqEntries } from './blog-schema'

const CONTENT = `Intro paragraph.

## How to Build Something

### This Is An Implementation Heading

Not a question.

## FAQ: SaaS Gamification and Activation

### Does gamification improve activation?

Yes, when the **mechanics** sit on the [critical path](/status) to first value.

### What is a good activation rate?

Benchmarks put it near \`35-45%\`.

## Start Building

Closing CTA.
`

describe('extractFaqEntries', () => {
  it('extracts only the H3s inside the FAQ section', () => {
    const entries = extractFaqEntries(CONTENT)

    expect(entries).toHaveLength(2)
    expect(entries.map((e) => e.question)).toEqual([
      'Does gamification improve activation?',
      'What is a good activation rate?',
    ])
  })

  it('stops at the next H2 so trailing sections are not swallowed', () => {
    const answers = extractFaqEntries(CONTENT).map((e) => e.answer)
    expect(answers.join(' ')).not.toContain('Closing CTA')
  })

  it('strips inline markdown so schema text matches the rendered page', () => {
    const [first, second] = extractFaqEntries(CONTENT)

    expect(first.answer).toBe('Yes, when the mechanics sit on the critical path to first value.')
    expect(second.answer).toBe('Benchmarks put it near 35-45%.')
  })

  it('returns nothing when the post has no FAQ section', () => {
    expect(extractFaqEntries('## Just A Heading\n\nBody text.')).toEqual([])
  })
})

describe('buildFaqSchema', () => {
  it('returns null rather than an empty FAQPage', () => {
    expect(buildFaqSchema([])).toBeNull()
  })

  it('emits one Question per entry', () => {
    const schema = buildFaqSchema(extractFaqEntries(CONTENT))
    expect(schema?.['@type']).toBe('FAQPage')
    expect(schema?.mainEntity).toHaveLength(2)
    expect(schema?.mainEntity[0].acceptedAnswer['@type']).toBe('Answer')
  })
})

describe('the published gamification post', () => {
  const post = getPostBySlug('high-converting-saas-funnels')!

  it('yields a valid BlogPosting schema', () => {
    const schema = buildArticleSchema(post)

    expect(schema['@type']).toBe('BlogPosting')
    expect(schema.headline).toBe('SaaS Gamification: 7 Loops for Activation')
    expect(schema.url).toMatch(/\/blog\/high-converting-saas-funnels$/)
    expect(schema.datePublished).toBe('2026-07-20')
    expect(schema.wordCount).toBeGreaterThan(500)
  })

  it('yields three FAQ entries with substantive answers', () => {
    const entries = extractFaqEntries(post.content)

    expect(entries).toHaveLength(3)
    for (const entry of entries) {
      expect(entry.question.endsWith('?')).toBe(true)
      expect(entry.answer.length).toBeGreaterThan(120)
      expect(entry.answer).not.toMatch(/[*`]/)
    }
  })
})
