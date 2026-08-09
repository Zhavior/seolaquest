import type { MetadataRoute } from 'next'
import { absoluteUrl } from '@/lib/siteUrl'

/**
 * Everything under `/app` is the signed-in product, `/dev` is scratch UI, and
 * `/onboarding` is a redirect target — none of them render anything a crawler
 * should index, and `/api` answers with JSON. Disallowing them keeps the
 * crawl budget on the marketing and content surface.
 *
 * Note this is a crawl directive, not an access control. Auth for those routes
 * lives in `proxy.ts`; robots.txt only asks well-behaved bots not to look.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // `/monitoring` is Sentry's browser tunnel, not a page. `/specs`
      // 308-redirects to /status, which is listed in the sitemap instead.
      disallow: [
        '/api/',
        '/app/',
        '/dev/',
        '/monitoring',
        '/onboarding',
        '/os-preview',
        '/sign-in',
        '/sign-up',
        '/specs',
      ],
    },
    sitemap: absoluteUrl('/sitemap.xml'),
    host: absoluteUrl('/').replace(/\/$/, ''),
  }
}
