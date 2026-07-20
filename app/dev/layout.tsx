import type { Metadata } from 'next'

// Internal editing tools — never indexable, regardless of how the URL is
// reached (robots.txt alone only stops crawling, not indexing of a bare
// linked URL).
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function DevLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
