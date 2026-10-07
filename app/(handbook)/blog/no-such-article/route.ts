/**
 * A real 404 document for unknown article slugs. It is a plain HTML response
 * rather than a rendered page so the status stays 404 under the auth
 * middleware (see [slug]/page.tsx), which means it cannot use the handbook
 * frame. The styles are inlined to keep it in the same world: a milk leaf on a
 * chrome-yellow board.
 */
const missingArticleDocument = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex,follow">
    <title>Article Not Found | SEOlaQuest</title>
    <style>
      body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 1.5rem; background: #F2C400; color: #14120E; font: 1.2rem/1.5 Georgia, serif; }
      main { max-width: 34rem; padding: 2rem 2rem 2rem 3rem; background: #F9EEA0; border: 2px solid #14120E; box-shadow: 6px 6px 0 #8F7600; }
      h1 { margin: 0 0 1rem; font: 800 2.6rem/1 Helvetica, Arial, sans-serif; letter-spacing: -0.04em; }
      p { margin: 0 0 1rem; }
      a { color: #14120E; font: 700 1rem Helvetica, Arial, sans-serif; text-underline-offset: 4px; }
    </style>
  </head>
  <body>
    <main>
      <h1>Article not found</h1>
      <p>This SEOlaQuest article does not exist.</p>
      <p><a href="/blog">Back to the field notes</a> &middot; <a href="/">Home</a></p>
    </main>
  </body>
</html>`

export function GET() {
  return new Response(missingArticleDocument, {
    status: 404,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  })
}
