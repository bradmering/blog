export const SITE_URL = 'https://bradmering.com'
export const SITE_NAME = 'Bradley Mering'
export const DEFAULT_OG_IMAGE = '/og-default.jpg'

/**
 * Next.js does not deep-merge `openGraph`/`twitter` objects across the
 * layout tree — a page that sets either fully replaces the root layout's
 * version, silently dropping `images`, `type`, `card`, etc. This helper
 * builds a complete, self-contained metadata object per page so nothing
 * gets lost to that behavior.
 */
export function pageMetadata({
  title,
  description,
  path,
  image,
  type = 'website',
  publishedTime,
}: {
  title: string
  description?: string
  path: string
  image?: string
  type?: 'website' | 'article'
  publishedTime?: string
}) {
  const images = [{ url: image ?? DEFAULT_OG_IMAGE }]
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type,
      siteName: SITE_NAME,
      title,
      description,
      url: path,
      images,
      ...(publishedTime ? { publishedTime } : {}),
    },
    twitter: {
      card: 'summary_large_image' as const,
      title,
      description,
      images,
    },
  }
}
