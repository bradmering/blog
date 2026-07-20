import { notFound } from 'next/navigation'
import GeoStoryLoader from '@/components/GeoStory/Loader'
import { getStory } from '@/lib/stories'
import { pageMetadata } from '@/lib/seo'

const HOME_STORY_SLUG = 'brooks-range'

export async function generateMetadata() {
  const story = await getStory(HOME_STORY_SLUG)
  if (!story) return {}
  const titleChapter = story.chapters.find((c) => c.type === 'title') as { image?: string } | undefined
  return pageMetadata({
    title: `${story.title} — Bradley Mering`,
    description: story.subtitle,
    path: '/',
    image: titleChapter?.image,
  })
}

export default async function Home() {
  const story = await getStory(HOME_STORY_SLUG)
  if (!story) notFound()

  return <GeoStoryLoader story={story as any} />
}
