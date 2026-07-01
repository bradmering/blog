'use client'

import dynamic from 'next/dynamic'
import type { TopoStory, TopoData } from './types'

const TopoStoryComponent = dynamic(() => import('./index'), { ssr: false })

export default function TopoStoryLoader({ story, topoData }: { story: TopoStory; topoData: TopoData }) {
  return <TopoStoryComponent story={story} topoData={topoData} />
}
