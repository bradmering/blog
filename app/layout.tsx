import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import Nav from '@/components/Nav'
import { SITE_URL, SITE_NAME, DEFAULT_OG_IMAGE, pageMetadata } from '@/lib/seo'
import { Analytics } from "@vercel/analytics/next"
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

const SITE_DESCRIPTION = 'Adventures, reflections, and projects.'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  ...pageMetadata({ title: SITE_NAME, description: SITE_DESCRIPTION, path: '/', image: DEFAULT_OG_IMAGE }),
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body className="min-h-screen bg-white">
        <Nav />
        <main className="pt-14">{children}</main>
        <Analytics />
      </body>
    </html>
  )
}
