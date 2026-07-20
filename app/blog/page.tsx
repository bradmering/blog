import { getAllPosts } from '@/lib/posts'
import { getAllStories } from '@/lib/stories'
import type { Tag } from '@/lib/posts'
import { pageMetadata } from '@/lib/seo'
import FeedRow from '@/components/FeedRow'

const ALL_TAGS: Tag[] = ['adventures', 'reflections', 'projects']

export const metadata = pageMetadata({
  title: 'Journal — Bradley Mering',
  description: 'Trip reports, stories, and reflections from the field.',
  path: '/blog',
})

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string }>
}) {
  const params = await searchParams
  const activeTag = ALL_TAGS.includes(params.tag as Tag) ? (params.tag as Tag) : null

  const posts = getAllPosts()
  const stories = getAllStories()

  // Build a unified feed sorted newest-first.
  // Tag filter applies to posts only; stories always appear in "All".
  const postItems = (activeTag ? posts.filter(p => p.tags.includes(activeTag)) : posts).map(p => ({
    key: `post-${p.slug}`,
    href: `/blog/${p.slug}`,
    image: p.image,
    imageAlt: p.imageAlt,
    title: p.title,
    description: p.excerpt,
    date: p.date,
    label: p.tags[0]
      ? p.tags[0].charAt(0).toUpperCase() + p.tags[0].slice(1)
      : 'Post',
    sortDate: new Date(p.date).getTime(),
  }))

  const storyItems = activeTag ? [] : stories.map(s => ({
    key: `story-${s.slug}`,
    href: `/stories/${s.slug}`,
    image: s.image,
    imageAlt: s.title,
    title: s.title,
    description: s.subtitle,
    date: s.date,
    label: s.isTopoStory ? 'Topo' : 'Story',
    sortDate: new Date(s.date).getTime(),
  }))

  const feed = [...postItems, ...storyItems].sort((a, b) => b.sortDate - a.sortDate)

  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-stone-900 tracking-tight mb-6">
          Journal
        </h1>
        <div className="flex items-center gap-2 flex-wrap">
          <a
            href="/blog"
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              !activeTag ? 'bg-stone-900 text-white' : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            All
          </a>
          {ALL_TAGS.map((tag) => (
            <a
              key={tag}
              href={`/blog?tag=${tag}`}
              className={`px-3 py-1.5 rounded-full text-sm font-medium capitalize transition-colors ${
                activeTag === tag ? 'bg-stone-900 text-white' : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              {tag}
            </a>
          ))}
        </div>
      </div>

      {feed.length === 0 ? (
        <p className="text-stone-400">No posts found.</p>
      ) : (
        <div>
          {feed.map(item => (
            <FeedRow
              key={item.key}
              href={item.href}
              image={item.image}
              imageAlt={item.imageAlt}
              title={item.title}
              description={item.description}
              date={item.date}
              label={item.label}
            />
          ))}
        </div>
      )}
    </div>
  )
}
