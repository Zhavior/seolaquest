import { getAllPosts, getFeaturedPost } from '@/lib/blog'
import { BlogIndex } from '@/features/handbook/blog/BlogIndex'

export const revalidate = 3600 // 1 hour caching for blog

// This is the hub page for the article cluster, so its title has to carry the
// entities the posts compete for. "Guild Lore" is internal language nobody
// searches, and at 64 characters the old title was also truncated in the SERP.
export const metadata = {
  title: 'SEO Growth & Developer Playbooks | SEOlaQuest Blog',
  description:
    'Implementation guides on SaaS gamification, activation metrics, React UI, and lead-response speed. Working code; benchmarks are industry orientation, not SEOlaQuest results.',
  alternates: { canonical: '/blog' },
  openGraph: { url: '/blog' },
}

export default function BlogPage() {
  const posts = getAllPosts()
  const featured = getFeaturedPost()

  return <BlogIndex posts={posts} featured={featured} />
}
