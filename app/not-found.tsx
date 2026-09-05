import Link from 'next/link'

export const metadata = {
  title: 'Page Not Found | SEOlaQuest',
  description: 'The requested page does not exist.',
}

// Without this route, every 404 on the public site falls back to the built-in
// Next.js page, which renders no `main` landmark and no way back into the site.
// The accessibility gate treats a missing main landmark as a hard failure.
export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas p-6">
      <section className="max-w-xl rounded-[20px] border border-outline bg-card p-8">
        <p className="text-xs font-semibold text-ink-muted">SEOlaQuest could not find this page</p>
        <h1 className="font-display mt-3 text-3xl font-medium">Nothing here.</h1>
        <p className="mt-4 font-medium text-ink-muted">
          The address may be mistyped, or the page may have been retired. The links below still work.
        </p>
        <nav aria-label="Recovery links" className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/"
            className="rounded-xl border border-outline bg-accent px-5 py-3 font-semibold text-on-accent"
          >
            Home
          </Link>
          <Link
            href="/blog"
            className="rounded-xl border border-outline bg-card px-5 py-3 font-semibold"
          >
            Blog
          </Link>
          <Link
            href="/pricing"
            className="rounded-xl border border-outline bg-card px-5 py-3 font-semibold"
          >
            Pricing
          </Link>
        </nav>
      </section>
    </main>
  )
}
