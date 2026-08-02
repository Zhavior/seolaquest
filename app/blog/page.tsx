import { getAllPosts, getFeaturedPost } from '@/lib/blog'
import BlogIndexClient from './BlogIndexClient'

export const metadata = {
  title: 'CoQuest Blog & Content Engine | Arcade Playbooks & Guild Lore',
  description:
    'Tactical guides on speed-to-lead velocity, metered API monetization, arcade SaaS growth, and Guild Hall lore.',
}

export default function BlogPage() {
  const posts = getAllPosts()
  const featured = getFeaturedPost()

  return <BlogIndexClient initialPosts={posts} featuredPost={featured} />
}
