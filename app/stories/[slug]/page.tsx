import { notFound } from 'next/navigation'
import GeoStoryLoader from '@/components/GeoStory/Loader'
import TopoStoryLoader from '@/components/TopoStory/Loader'
import { getStory, getTopoData, getAllStorySlugs } from '@/lib/stories'
import { pageMetadata } from '@/lib/seo'
import type { TopoStory } from '@/components/TopoStory/types'

export async function generateStaticParams() {
  return getAllStorySlugs().map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const story = await getStory(slug)
  if (!story) return {}
  const titleChapter = story.chapters.find((c) => c.type === 'title') as { image?: string } | undefined
  // The Brooks Range story also lives at the site root; point crawlers there
  // as the canonical URL instead of splitting authority between two paths.
  const path = slug === 'brooks-range' ? '/' : `/stories/${slug}`
  return pageMetadata({
    title: `${story.title} — Bradley Mering`,
    description: story.subtitle,
    path,
    image: titleChapter?.image,
  })
}

export default async function StoryPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const story = await getStory(slug)
  if (!story) notFound()

  // Detect topo story by presence of any 'topo' chapter OR root-level topoSlug
  const isTopoStory =
    story.chapters.some((c) => c.type === 'topo') ||
    !!(story as { topoSlug?: string }).topoSlug

  if (isTopoStory) {
    const topoStory = story as TopoStory
    // Find the first topo chapter's slug to load topo data
    const firstTopoChapter = topoStory.chapters.find((c) => c.type === 'topo') as { topoSlug: string } | undefined
    const topoSlug = topoStory.topoSlug ?? firstTopoChapter?.topoSlug
    if (!topoSlug) notFound()

    const topoData = getTopoData(topoSlug)
    if (!topoData) notFound()

    return <TopoStoryLoader story={topoStory} topoData={topoData} />
  }

  return <GeoStoryLoader story={story as any} />
}
