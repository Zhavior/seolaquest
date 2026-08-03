export interface PostMetadata {
  published?: boolean
  title: string
  slug: string
  description: string
  date: string
  author: string
  authorRole: string
  authorAvatar: string
  tag: string
  featured: boolean
  coverColor: string
  readTimeMinutes: number
}

export interface TocHeading {
  id: string
  text: string
  level: number
}

export interface Post extends PostMetadata {
  content: string
  toc: TocHeading[]
}

/**
 * Calculate reading time in minutes based on word count
 */
export function calculateReadingTime(text: string): number {
  const words = text.replace(/[^\w\s]/g, '').split(/\s+/).filter(Boolean).length
  const wordsPerMinute = 200
  return Math.max(1, Math.ceil(words / wordsPerMinute))
}

/**
 * Pure client-side filtering function for posts by tag and search query
 */
export function filterPosts(posts: Post[], tag: string, searchQuery: string): Post[] {
  return posts.filter((post) => {
    const matchesTag =
      tag === '[ALL]' || tag === 'ALL' || post.tag === tag || post.tag.toLowerCase().includes(tag.toLowerCase())
    const query = searchQuery.toLowerCase().trim()
    const matchesSearch =
      !query ||
      post.title.toLowerCase().includes(query) ||
      post.description.toLowerCase().includes(query) ||
      post.author.toLowerCase().includes(query) ||
      post.content.toLowerCase().includes(query)

    return matchesTag && matchesSearch
  })
}
