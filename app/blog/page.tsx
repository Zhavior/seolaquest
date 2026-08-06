import { getAllPosts, getFeaturedPost } from '@/lib/blog'
import BlogIndexClient from './BlogIndexClient'

export const revalidate = 3600 // 1 hour caching for blog

export const metadata = {
  title: 'SEOlaQuest Blog & Content Engine | Arcade Playbooks & Guild Lore',
  description:
    'Tactical guides on speed-to-lead velocity, metered API monetization, arcade SaaS growth, and Guild Hall lore.',
}

export default function BlogPage() {
  const posts = getAllPosts()
  const featured = getFeaturedPost()

  return <BlogIndexClient initialPosts={posts} featuredPost={featured} />
}
