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
      <section className="max-w-xl border-4 border-outline bg-card p-8 shadow-brutal-lg">
        <p className="text-xs font-black uppercase text-ink-muted">SEOlaQuest could not find this page</p>
        <h1 className="mt-3 text-3xl font-black uppercase">Nothing here.</h1>
        <p className="mt-4 font-bold text-ink-muted">
          The address may be mistyped, or the page may have been retired. The links below still work.
        </p>
        <nav aria-label="Recovery links" className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/"
            className="border-4 border-outline bg-accent px-5 py-3 font-black uppercase text-on-accent shadow-brutal"
          >
            Home
          </Link>
          <Link
            href="/blog"
            className="border-4 border-outline bg-card px-5 py-3 font-black uppercase shadow-brutal"
          >
            Blog
          </Link>
          <Link
            href="/pricing"
            className="border-4 border-outline bg-card px-5 py-3 font-black uppercase shadow-brutal"
          >
            Pricing
          </Link>
        </nav>
      </section>
    </main>
  )
}
