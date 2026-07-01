'use client'

import dynamic from 'next/dynamic'
import type { Story } from './types'

const GeoStory = dynamic(() => import('./index'), { ssr: false })

export default function GeoStoryLoader({ story }: { story: Story }) {
  return <GeoStory story={story} />
}
