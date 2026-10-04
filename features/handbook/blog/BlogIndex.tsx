'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { ALL_TAG, BlogTagFilter, deriveTags } from '@/features/blog/components/BlogTagFilter'
import { filterPosts, type Post } from '@/lib/blog-types'
import { Board, Leaf, Spread } from '../components/primitives'
import { stripEmoji } from '../text'

function formatDate(value: string) {
  const parsed = new Date(`${value}T00:00:00Z`)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' })
}

export function BlogIndex({ posts, featured }: { posts: Post[]; featured: Post | null }) {
  const [tag, setTag] = useState<string>(ALL_TAG)
  const [query, setQuery] = useState('')

  // Only categories with a published post behind them get a button.
  const tags = useMemo(() => deriveTags(posts), [posts])
  const filtered = filterPosts(posts, tag, query)
  const showFeatured = Boolean(featured) && tag === ALL_TAG && !query
  const rows = showFeatured ? filtered.filter((post) => post.slug !== featured!.slug) : filtered

  return (
    <Board volume="notes" first labelledBy="blog-title">
      <Leaf>
        <Spread
          head="Field Notes"
          headLevel="p"
          note="Articles are opinion and orientation. Benchmarks in them are industry figures, not SEOlaQuest results."
        >
          <div className="hb-stack" style={{ '--gap': '1.75rem' } as React.CSSProperties}>
            {/* The H1 is the on-page half of the title tag: it carries the same searchable entities. */}
            <h1 id="blog-title" className="hb-display hb-display--post">
              SEO Growth &amp; Developer Playbooks
            </h1>
            <p className="hb-lede">
              Implementation guides on SaaS gamification, activation metrics, React UI, and lead-response speed.
            </p>

            <div className="hb-search">
              <label htmlFor="blog-search" className="hb-mono">
                Search articles
              </label>
              <div className="hb-search-field">
                <Search size={18} aria-hidden="true" />
                <input
                  id="blog-search"
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Keyword or topic"
                  autoComplete="off"
                />
              </div>
            </div>

            <BlogTagFilter tags={tags} activeTag={tag} onSelectTag={setTag} />

            {showFeatured && featured ? (
              <section aria-labelledby="featured-title" className="hb-ply hb-featured">
                <p className="hb-mono hb-soft">
                  <time dateTime={featured.date}>{formatDate(featured.date)}</time> · {featured.readTimeMinutes} min read ·{' '}
                  {stripEmoji(featured.tag)}
                </p>
                <h2 id="featured-title" className="hb-h2">
                  <Link href={`/blog/${featured.slug}`}>{stripEmoji(featured.title)}</Link>
                </h2>
                <p className="hb-prose">{featured.description}</p>
                <p>
                  <Link href={`/blog/${featured.slug}`} className="hb-link">
                    Read the note
                  </Link>
                </p>
              </section>
            ) : null}

            {rows.length > 0 ? (
              <ol className="hb-notes" aria-label={`${filtered.length} article${filtered.length === 1 ? '' : 's'}`}>
                {rows.map((post) => (
                  <li key={post.slug}>
                    <p className="hb-mono hb-soft">
                      <time dateTime={post.date}>{formatDate(post.date)}</time> · {post.readTimeMinutes} min read ·{' '}
                      {stripEmoji(post.tag)}
                    </p>
                    <h2 className="hb-h3">
                      <Link href={`/blog/${post.slug}`}>{stripEmoji(post.title)}</Link>
                    </h2>
                    <p className="hb-soft">{post.description}</p>
                  </li>
                ))}
              </ol>
            ) : filtered.length === 0 ? (
              <div className="hb-empty" role="status">
                <p>No articles match. Try another search or category.</p>
                <p style={{ marginTop: '0.8rem' }}>
                  <button
                    type="button"
                    className="hb-btn hb-btn--label hb-btn--small"
                    onClick={() => {
                      setTag(ALL_TAG)
                      setQuery('')
                    }}
                  >
                    Reset filters
                  </button>
                </p>
              </div>
            ) : null}
          </div>
        </Spread>
      </Leaf>
    </Board>
  )
}
