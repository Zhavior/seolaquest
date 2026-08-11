import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getAllPosts, getPostBySlug, getRelatedPosts } from '@/lib/blog'
import { buildArticleSchema, buildFaqSchema, extractFaqEntries } from '@/lib/blog-schema'
import { PostReaderClient } from '@/features/blog/components/PostReaderClient'

interface PostPageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const posts = getAllPosts()
  return posts.map((post) => ({
    slug: post.slug,
  }))
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const resolvedParams = await params
  const post = getPostBySlug(resolvedParams.slug)

  if (!post) {
    return {
      title: 'Article Not Found | SEOlaQuest Blog',
    }
  }

  return {
    // Every character here is a character stolen from the headline. Google
    // truncates the SERP title around 60; " | SEOlaQuest" costs 13, the old
    // " | SEOlaQuest Blog" cost 18, and "Blog" adds no search value.
    title: `${post.title} | SEOlaQuest`,
    description: post.description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      url: `/blog/${post.slug}`,
      publishedTime: post.date,
      authors: [post.author],
      tags: [post.tag],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
    },
  }
}

export default async function PostPage({ params }: PostPageProps) {
  const resolvedParams = await params
  const post = getPostBySlug(resolvedParams.slug)

  if (!post) {
    notFound()
  }

  const related = getRelatedPosts(post.slug, post.tag)

  // Derived from the post body, so the markup can never disagree with the page.
  const schemas = [buildArticleSchema(post), buildFaqSchema(extractFaqEntries(post.content))].filter(
    (schema) => schema !== null
  )

  return (
    <>
      {schemas.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          // Schema objects are built from our own MDX, never from user input.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      <PostReaderClient post={post} relatedPosts={related} />
    </>
  )
}
