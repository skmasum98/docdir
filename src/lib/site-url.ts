/**
 * Canonical public host for SEO output (canonical tags, sitemap, robots,
 * Open Graph URLs, JSON-LD item URLs).
 *
 * Must be the host that serves HTTP 200. The apex domain currently
 * 308-redirects to www, so every canonical pointing at the apex was
 * flagged as "canonical points to redirect". Keep this on www until the
 * hosting redirect direction ever changes.
 */
export const SITE_URL = "https://www.drchamber.info";

export function canonicalUrl(path: string = "/"): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
