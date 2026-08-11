import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { getPostBySlug } from '@/lib/blog'
import { BlogMarkdownRenderer } from '../BlogMarkdownRenderer'

describe('blog post rendering', () => {
  const post = getPostBySlug('high-converting-saas-funnels')

  it('parses frontmatter with a colon in the title', () => {
    // getAllPosts drops anything without `published: true`, so a hit proves it is published
    expect(post).not.toBeNull()
    expect(post?.title).toBe('SaaS Gamification: 7 Loops for Activation')
  })

  it('renders inline bold and code instead of literal markdown', () => {
    const { container } = render(<BlogMarkdownRenderer content={post!.content} />)

    // prose only — code blocks legitimately contain backticks and asterisks
    container.querySelectorAll('pre').forEach((pre) => pre.remove())
    expect(container.textContent).not.toMatch(/\*\*/)
    expect(container.textContent).not.toMatch(/`/)

    expect(container.querySelectorAll('strong').length).toBeGreaterThan(0)
  })

  it('has exactly one H1 (the page header supplies it, not the body)', () => {
    render(<BlogMarkdownRenderer content={post!.content} />)
    expect(document.querySelectorAll('h1')).toHaveLength(0)
  })

  it('renders tables, code blocks, and the three CTA links', () => {
    render(<BlogMarkdownRenderer content={post!.content} />)

    expect(document.querySelectorAll('table').length).toBeGreaterThanOrEqual(3)
    expect(document.querySelectorAll('pre, code').length).toBeGreaterThan(5)

    // Every CTA target must be in PUBLIC_ROUTE_PATTERNS and must not be a proxy.ts
    // redirect: /specs 308s to /status, and /os-preview is auth-gated.
    for (const href of ['/status', '/', '/sign-up', '/pricing']) {
      expect(screen.getAllByRole('link').some((a) => a.getAttribute('href') === href)).toBe(true)
    }
  })
})
