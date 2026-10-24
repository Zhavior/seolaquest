// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { readPublishedSources, renderModule, renderSlugsModule, isPublished } from '../scripts/generate-blog-posts.mjs'
import { BLOG_POST_SOURCES } from './generated/blogPosts'
import { BLOG_POST_SLUGS } from './generated/blogSlugs'
import { getAllPosts } from './blog'
import fs from 'node:fs'
import path from 'node:path'

describe('bundled blog posts', () => {
  it('matches the published posts in content/posts', () => {
    const committed = fs.readFileSync(path.join(__dirname, 'generated', 'blogPosts.ts'), 'utf8')
    // If this fails, a post changed without regenerating: run `npm run blog:generate`.
    expect(committed).toBe(renderModule(readPublishedSources()))
    const committedSlugs = fs.readFileSync(path.join(__dirname, 'generated', 'blogSlugs.ts'), 'utf8')
    expect(committedSlugs).toBe(renderSlugsModule(readPublishedSources()))
  })

  it('gives middleware the same slugs the blog serves', () => {
    expect([...BLOG_POST_SLUGS]).toEqual(getAllPosts().map((post) => post.slug).sort())
  })

  it('serves posts without reading the filesystem at runtime', () => {
    expect(BLOG_POST_SOURCES.length).toBeGreaterThan(0)
    expect(getAllPosts()).toHaveLength(BLOG_POST_SOURCES.length)
  })

  it('bundles only posts marked published', () => {
    expect(isPublished('---\ntitle: A\npublished: true\n---\nbody')).toBe(true)
    expect(isPublished('---\ntitle: A\npublished: false\n---\nbody')).toBe(false)
    expect(isPublished('---\ntitle: A\n---\npublished: true')).toBe(false)
  })
})
