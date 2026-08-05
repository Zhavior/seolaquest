import { permanentRedirect } from 'next/navigation'

/**
 * `/` is the canonical marketing page. This route previously rendered the same
 * component, publishing identical content at two indexable URLs with no canonical
 * link between them. It redirects instead of duplicating so existing inbound links
 * and bookmarks keep working.
 */
export default function LandingRedirect() {
  permanentRedirect('/')
}
