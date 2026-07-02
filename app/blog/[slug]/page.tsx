import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getAllPosts, getPost, formatDate } from '@/lib/posts'
import TagBadge from '@/components/TagBadge'
import CoordinatesDisplay from '@/components/CoordinatesDisplay'
import ItineraryMapLoader from '@/components/ItineraryMap/Loader'

export async function generateStaticParams() {
  const posts = getAllPosts()
  return posts.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) return {}
  return {
    title: `${post.title} — Bradley Mering`,
    description: post.excerpt,
  }
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) notFound()

  return (
    <div>
      {/* Hero */}
      <div className="relative w-full h-[65vh] min-h-[440px] bg-stone-100">
        <Image
          src={post.image}
          alt={post.imageAlt}
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/65" />

        <div className="absolute top-6 left-0 right-0 max-w-5xl mx-auto px-6">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-white/80 hover:text-white text-sm transition-colors"
          >
            ← Journal
          </Link>
        </div>

        <div className="absolute bottom-0 left-0 right-0 max-w-5xl mx-auto px-6 pb-10">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {post.tags.map((tag) => (
              <TagBadge key={tag} tag={tag} />
            ))}
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight tracking-tight max-w-3xl">
            {post.title}
          </h1>
        </div>
      </div>

      {/* Meta + Excerpt */}
      <div className="max-w-5xl mx-auto px-6">
        <div className="max-w-2xl mx-auto pt-12 pb-10">
          <div className="flex items-center gap-4 mb-8 pb-8 border-b border-stone-100 flex-wrap">
            <time className="text-sm text-stone-400 font-medium">
              {formatDate(post.date)}
            </time>
            {post.coordinates && (
              <>
                <span className="text-stone-200" aria-hidden>·</span>
                <CoordinatesDisplay coords={post.coordinates} />
              </>
            )}
            {post.trackingUrl && (
              <a
                href="#live-tracking"
                className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700 border border-red-200 hover:border-red-300 rounded-full px-3 py-1 transition-colors"
              >
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                Live Tracking
              </a>
            )}
          </div>

          <div className="text-xl text-stone-600 leading-relaxed font-medium space-y-4">
            {post.excerpt.split(/\n\n+/).map((para, i) => (
              <p key={i}>{para.trim()}</p>
            ))}
          </div>
        </div>
      </div>

      {/* Itinerary Map — full width, between excerpt and body */}
      {post.itinerary && post.itinerary.length > 0 && (
        <ItineraryMapLoader stops={post.itinerary} />
      )}

      {/* Post body */}
      <div className="max-w-5xl mx-auto px-6">
        <div className="max-w-2xl mx-auto pt-12 pb-16">
          <div
            className="prose prose-stone max-w-none"
            dangerouslySetInnerHTML={{ __html: post.content ?? '' }}
          />
        </div>
      </div>
    </div>
  )
}
