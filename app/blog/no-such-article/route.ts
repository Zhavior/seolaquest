const missingArticleDocument = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex,follow">
    <title>Article Not Found | SEOlaQuest</title>
  </head>
  <body>
    <main>
      <h1>Article not found</h1>
      <p>This SEOlaQuest article does not exist.</p>
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
