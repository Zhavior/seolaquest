import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { Post } from '@/lib/blog-types'
import { BlogMarkdownRenderer } from '@/features/blog/components/BlogMarkdownRenderer'
import { absoluteUrl } from '@/lib/siteUrl'
import { stripEmoji } from '../text'
import { Board, Leaf } from '../components/primitives'
import { CopyLink } from './CopyLink'
import { TocNav } from './TocNav'

function formatDate(value: string) {
  const parsed = new Date(`${value}T00:00:00Z`)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })
}

/**
 * The page header supplies the H1, so a body that opens by repeating the title
 * as its own first heading would print it twice. Only an exact repeat is dropped.
 */
function withoutRepeatedTitle(content: string, title: string): string {
  const match = /^\s*#\s+(.+?)\s*\n+/.exec(content)
  if (match && stripEmoji(match[1]).toLowerCase() === stripEmoji(title).toLowerCase()) {
    return content.slice(match[0].length)
  }
  return content
}

export function PostView({ post, related }: { post: Post; related: Post[] }) {
  const title = stripEmoji(post.title)
  const tag = stripEmoji(post.tag)
  const url = absoluteUrl(`/blog/${post.slug}`)
  const tweet = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`

  return (
    <Board volume="notes" first labelledBy="post-title">
      <Leaf>
        <article>
          <header className="hb-post-head hb-stack" style={{ '--gap': '1.25rem' } as React.CSSProperties}>
            <nav aria-label="Breadcrumb" className="hb-mono hb-soft">
              <Link href="/blog">Field Notes</Link> / <span>{tag}</span>
            </nav>
            <h1 id="post-title" className="hb-display hb-display--post">
              {title}
            </h1>
            <p className="hb-lede">{post.description}</p>
            <p className="hb-mono hb-soft">
              <time dateTime={post.date}>{formatDate(post.date)}</time> · {post.readTimeMinutes} min read · {post.author},{' '}
              {post.authorRole}
            </p>
          </header>

          <div className="hb-spread hb-post-body">
            <aside className="hb-side" aria-label="Article tools">
              <TocNav toc={post.toc} />
              <div className="hb-share">
                <CopyLink url={url} />
                <a className="hb-btn hb-btn--label hb-btn--small" href={tweet} target="_blank" rel="noopener noreferrer">
                  Share on X
                </a>
              </div>
            </aside>

            <div className="hb-main">
              <div className="hb-article">
                <BlogMarkdownRenderer content={withoutRepeatedTitle(post.content, post.title)} />
              </div>

              <aside className="hb-post-cta hb-ply" aria-label="Try SEOlaQuest">
                <h2 className="hb-h3">See the loop with invented posts</h2>
                <p className="hb-prose">
                  Scan, read the source post, claim a lead, and watch the real XP rules pay or refuse to pay. No account
                  needed.
                </p>
                <div className="hb-row">
                  <Link href="/radar" className="hb-btn">
                    Try the sample hunt <ArrowRight size={18} aria-hidden="true" />
                  </Link>
                  <Link href="/pricing" className="hb-btn hb-btn--label">
                    Pricing
                  </Link>
                </div>
              </aside>
            </div>
          </div>
        </article>

        {related.length > 0 ? (
          <section aria-labelledby="related-title" className="hb-related">
            <h2 id="related-title" className="hb-h2">
              More field notes
            </h2>
            <ol className="hb-notes">
              {related.map((item) => (
                <li key={item.slug}>
                  <p className="hb-mono hb-soft">
                    <time dateTime={item.date}>{formatDate(item.date)}</time> · {item.readTimeMinutes} min read
                  </p>
                  <h3 className="hb-h3">
                    <Link href={`/blog/${item.slug}`}>{stripEmoji(item.title)}</Link>
                  </h3>
                  <p className="hb-soft">{item.description}</p>
                </li>
              ))}
            </ol>
          </section>
        ) : null}
      </Leaf>
    </Board>
  )
}
