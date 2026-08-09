import type { MetadataRoute } from 'next'
import { getAllPosts } from '@/lib/blog'
import { absoluteUrl } from '@/lib/siteUrl'

/**
 * Only publicly reachable, indexable routes belong here. Anything disallowed in
 * `robots.ts` must stay out: listing a URL in the sitemap while blocking it in
 * robots.txt is a contradiction Search Console reports as an error.
 *
 * `/specs` is deliberately absent — proxy.ts 308-redirects it to `/status`, so
 * listing it would advertise a URL that never returns 200. `/status` is the
 * one that renders.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPosts()

  // The newest post is the best available proxy for "when did /blog change".
  const blogLastModified = posts[0]?.date ? new Date(posts[0].date) : new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: absoluteUrl('/'), changeFrequency: 'weekly', priority: 1 },
    { url: absoluteUrl('/pricing'), changeFrequency: 'weekly', priority: 0.9 },
    { url: absoluteUrl('/blog'), lastModified: blogLastModified, changeFrequency: 'weekly', priority: 0.8 },
    { url: absoluteUrl('/status'), changeFrequency: 'monthly', priority: 0.5 },
    { url: absoluteUrl('/api-terms'), changeFrequency: 'yearly', priority: 0.3 },
    { url: absoluteUrl('/privacy'), changeFrequency: 'yearly', priority: 0.3 },
    { url: absoluteUrl('/terms'), changeFrequency: 'yearly', priority: 0.3 },
  ]

  const postRoutes: MetadataRoute.Sitemap = posts.map((post) => ({
    url: absoluteUrl(`/blog/${post.slug}`),
    lastModified: post.date ? new Date(post.date) : undefined,
    changeFrequency: 'monthly',
    priority: 0.7,
  }))

  return [...staticRoutes, ...postRoutes]
}
