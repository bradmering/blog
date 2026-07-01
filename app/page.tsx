import Image from 'next/image'
import Link from 'next/link'
import { getAllPosts, getPost, formatDate } from '@/lib/posts'
import TagBadge from '@/components/TagBadge'
import PostTeaser from '@/components/PostTeaser'
import CoordinatesDisplay from '@/components/CoordinatesDisplay'
import ItineraryMapLoader from '@/components/ItineraryMap/Loader'

export default async function Home() {
  const allPosts = getAllPosts()
  const [latestMeta, ...olderPosts] = allPosts

  if (!latestMeta) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-24 text-center text-stone-400">
        No posts yet.
      </div>
    )
  }

  const latest = await getPost(latestMeta.slug)
  if (!latest) return null

  const teasers = olderPosts.slice(0, 3)

  return (
    <div>
      {/* Hero image */}
      <div className="relative w-full h-[70vh] min-h-[480px] bg-stone-100">
        <Image
          src={latest.image}
          alt={latest.imageAlt}
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60" />
        <div className="absolute bottom-0 left-0 right-0 max-w-5xl mx-auto px-6 pb-10">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {latest.tags.map((tag) => (
              <TagBadge key={tag} tag={tag} />
            ))}
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight tracking-tight max-w-3xl">
            {latest.title}
          </h1>
        </div>
      </div>

      {/* Meta + Excerpt */}
      <div className="max-w-5xl mx-auto px-6">
        <div className="max-w-2xl mx-auto pt-12 pb-10">
          <div className="flex items-center gap-4 mb-8 pb-8 border-b border-stone-100 flex-wrap">
            <time className="text-sm text-stone-400 font-medium">
              {formatDate(latest.date)}
            </time>
            {latest.coordinates && (
              <>
                <span className="text-stone-200" aria-hidden>·</span>
                <CoordinatesDisplay coords={latest.coordinates} />
              </>
            )}
          </div>

          <div className="text-xl text-stone-600 leading-relaxed font-medium space-y-4">
            {latest.excerpt.split(/\n\n+/).map((para, i) => (
              <p key={i}>{para.trim()}</p>
            ))}
          </div>
        </div>
      </div>

      {/* Itinerary Map — full width, between excerpt and body */}
      {latest.itinerary && latest.itinerary.length > 0 && (
        <ItineraryMapLoader stops={latest.itinerary} />
      )}

      {/* Body */}
      <div className="max-w-5xl mx-auto px-6">
        <div className="max-w-2xl mx-auto pt-12 pb-12">
          <div
            className="prose prose-stone max-w-none"
            dangerouslySetInnerHTML={{ __html: latest.content ?? '' }}
          />
        </div>
      </div>

      {/* Older posts — up to 3 teasers + link to all */}
      {teasers.length > 0 && (
        <div className="border-t border-stone-100 bg-stone-50/50">
          <div className="max-w-5xl mx-auto px-6 py-12">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xs font-semibold text-stone-400 tracking-widest uppercase">
                Earlier
              </h2>
              <Link
                href="/blog"
                className="text-sm text-stone-500 hover:text-stone-900 transition-colors"
              >
                All posts →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {teasers.map((post) => (
                <PostTeaser key={post.slug} post={post} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* No older posts — still show link to archive if there could be more later */}
      {teasers.length === 0 && (
        <div className="border-t border-stone-100">
          <div className="max-w-5xl mx-auto px-6 py-8 text-right">
            <Link href="/blog" className="text-sm text-stone-500 hover:text-stone-900 transition-colors">
              All posts →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
