import fs from 'fs'
import path from 'path'
import { Post, PostMetadata, TocHeading, calculateReadingTime } from './blog-types'

export type { Post, PostMetadata, TocHeading }
export { calculateReadingTime }

const POSTS_DIR = path.join(process.cwd(), 'content', 'posts')

/**
 * Basic Frontmatter Parser for Markdown/MDX without heavy native binary dependencies
 */
function parseFrontmatter(fileContent: string): { data: Partial<PostMetadata>; content: string } {
  const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/
  const match = frontmatterRegex.exec(fileContent)

  if (!match) {
    return { data: {}, content: fileContent }
  }

  const yamlBlock = match[1]
  const content = fileContent.slice(match[0].length)
  const data: Record<string, unknown> = {}

  yamlBlock.split('\n').forEach((line) => {
    const colonIndex = line.indexOf(':')
    if (colonIndex !== -1) {
      const key = line.slice(0, colonIndex).trim()
      let value = line.slice(colonIndex + 1).trim()

      // Strip outer quotes
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1)
      }

      if (value === 'true') data[key] = true
      else if (value === 'false') data[key] = false
      else if (!isNaN(Number(value)) && value.length > 0) data[key] = Number(value)
      else data[key] = value
    }
  })

  return { data: data as Partial<PostMetadata>, content }
}

/**
 * Extract H1, H2, H3 headings from markdown for Table of Contents
 */
function extractTocHeadings(content: string): TocHeading[] {
  const headingRegex = /^(#{1,3})\s+(.+)$/gm
  const headings: TocHeading[] = []
  let match: RegExpExecArray | null

  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length
    const rawText = match[2].trim()

    // Clean inline formatting like bold or links for heading text
    const text = rawText
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[*_~`]/g, '')
      .trim()

    const id = text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')

    headings.push({ id, text, level })
  }

  return headings
}

/**
 * Get all published posts sorted by date (newest first)
 */
export function getAllPosts(): Post[] {
  if (!fs.existsSync(POSTS_DIR)) {
    return []
  }

  const fileNames = fs.readdirSync(POSTS_DIR)
  const posts: Post[] = fileNames
    .filter((file) => file.endsWith('.mdx') || file.endsWith('.md'))
    .flatMap((fileName) => {
      const slugFromFile = fileName.replace(/\.mdx?$/, '')
      const filePath = path.join(POSTS_DIR, fileName)
      const fileContent = fs.readFileSync(filePath, 'utf8')
      const { data, content } = parseFrontmatter(fileContent)

      // Legacy articles contain unverified product and performance claims.
      // Publish only content that has been explicitly reviewed and opted in.
      if (data.published !== true) return []

      const slug = data.slug || slugFromFile
      const readTimeMinutes = data.readTimeMinutes || calculateReadingTime(content)
      const toc = extractTocHeadings(content)

      return [{
        title: data.title || 'Untitled Post',
        slug,
        description: data.description || '',
        date: data.date || new Date().toISOString().split('T')[0],
        author: data.author || 'CoQuest Lead Hunter',
        authorRole: data.authorRole || 'Guild Member',
        authorAvatar: data.authorAvatar || '⚔️',
        tag: data.tag || '[ALL]',
        featured: Boolean(data.featured),
        coverColor: data.coverColor || '#FFE600',
        readTimeMinutes,
        content,
        toc,
      }]
    })

  return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

/**
 * Get a single post by slug
 */
export function getPostBySlug(slug: string): Post | null {
  const posts = getAllPosts()
  return posts.find((p) => p.slug === slug) || null
}

/**
 * Get the featured post (top / latest post flagged as featured, or newest post)
 */
export function getFeaturedPost(): Post | null {
  const posts = getAllPosts()
  if (posts.length === 0) return null
  return posts.find((p) => p.featured) || posts[0]
}

/**
 * Get related posts matching the same tag or excluding current post
 */
export function getRelatedPosts(currentSlug: string, tag?: string, limit = 3): Post[] {
  const posts = getAllPosts().filter((p) => p.slug !== currentSlug)
  if (tag) {
    const tagged = posts.filter((p) => p.tag === tag)
    if (tagged.length >= limit) return tagged.slice(0, limit)
  }
  return posts.slice(0, limit)
}
