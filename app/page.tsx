import { notFound } from 'next/navigation'
import GeoStoryLoader from '@/components/GeoStory/Loader'
import { getStory } from '@/lib/stories'

const HOME_STORY_SLUG = 'brooks-range'

export async function generateMetadata() {
  const story = await getStory(HOME_STORY_SLUG)
  if (!story) return {}
  return {
    title: `${story.title} — Bradley Mering`,
    description: story.subtitle,
  }
}

export default async function Home() {
  const story = await getStory(HOME_STORY_SLUG)
  if (!story) notFound()

  return <GeoStoryLoader story={story as any} />
}
