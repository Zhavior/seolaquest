import { getAllPosts, getFeaturedPost } from '@/lib/blog'
import BlogIndexClient from './BlogIndexClient'

export const revalidate = 3600 // 1 hour caching for blog

// This is the hub page for the article cluster, so its title has to carry the
// entities the posts compete for. "Guild Lore" is internal language nobody
// searches, and at 64 characters the old title was also truncated in the SERP.
export const metadata = {
  title: 'SEO Growth & Developer Playbooks | SEOlaQuest Blog',
  description:
    'Implementation guides on SaaS gamification, activation metrics, neo-brutalist React UI, and lead-response speed. Working code, honest numbers.',
  alternates: { canonical: '/blog' },
  openGraph: { url: '/blog' },
}

export default function BlogPage() {
  const posts = getAllPosts()
  const featured = getFeaturedPost()

  return <BlogIndexClient initialPosts={posts} featuredPost={featured} />
}
