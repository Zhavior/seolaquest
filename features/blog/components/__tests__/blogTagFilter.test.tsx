import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { Post } from '@/lib/blog-types'
import { getAllPosts } from '@/lib/blog'
import { ALL_TAG, BlogTagFilter, deriveTags } from '../BlogTagFilter'

function post(slug: string, tag: string): Post {
  return {
    title: slug,
    slug,
    description: '',
    date: '2026-01-01',
    author: 'A',
    authorRole: 'R',
    authorAvatar: '',
    tag,
    featured: false,
    coverColor: '#000',
    readTimeMinutes: 1,
    content: '',
    toc: [],
  }
}

describe('deriveTags', () => {
  it('lists every tag that has a post, deduplicated and sorted', () => {
    const tags = deriveTags([post('a', 'SAAS GROWTH'), post('b', 'SAAS GROWTH'), post('c', 'GUILD LORE')])

    expect(tags).toEqual([ALL_TAG, 'GUILD LORE', 'SAAS GROWTH'])
  })

  it('never invents a category with no posts behind it', () => {
    // The regression this replaces: a hardcoded list advertised SPEED-TO-LEAD
    // and MANA & APIS while both posts were unpublished.
    const tags = deriveTags([post('a', 'SAAS GROWTH')])

    expect(tags).not.toContain('⚔️ SPEED-TO-LEAD')
    expect(tags).not.toContain('🧪 MANA & APIS')
  })

  it('ignores blank tags and never duplicates the ALL entry', () => {
    const tags = deriveTags([post('a', '   '), post('b', ALL_TAG), post('c', 'REAL')])

    expect(tags).toEqual([ALL_TAG, 'REAL'])
  })

  it('matches the tags of the actually published posts', () => {
    const tags = deriveTags(getAllPosts())

    // Every derived tag must belong to a real post, and vice versa.
    const postTags = new Set(getAllPosts().map((p) => p.tag))
    expect(new Set(tags.filter((t) => t !== ALL_TAG))).toEqual(postTags)
  })
})

describe('BlogTagFilter', () => {
  it('renders one button per tag', () => {
    render(<BlogTagFilter tags={[ALL_TAG, 'A', 'B']} activeTag={ALL_TAG} onSelectTag={vi.fn()} />)

    expect(screen.getAllByRole('button')).toHaveLength(3)
    expect(screen.getByRole('button', { name: ALL_TAG })).toHaveAttribute('aria-pressed', 'true')
  })

  it('hides itself when there is only one real category', () => {
    const { container } = render(
      <BlogTagFilter tags={[ALL_TAG, 'ONLY']} activeTag={ALL_TAG} onSelectTag={vi.fn()} />
    )

    expect(container).toBeEmptyDOMElement()
  })
})
