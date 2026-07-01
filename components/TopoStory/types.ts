import type { Chapter } from '../GeoStory/types'
import type { TopoData } from '../../lib/topo'

export type { TopoData }

export interface TopoChapter {
  id: string
  type: 'topo'
  topoSlug: string
  pitch?: number
  // image-space bounds [[x1,y1],[x2,y2]], top-left origin
  bounds: [[number, number], [number, number]]
  bgOpacity?: number
  routeProgress?: number
  foregroundImage?: string
  foregroundAlign?: 'left' | 'right' | 'center' | 'full'
  heading?: string
  subheading?: string
  text?: string
  align?: 'left' | 'right'
}

// All chapter types available in a TopoStory
export type TopoStoryChapter = Chapter | TopoChapter

export interface TopoStory {
  title: string
  subtitle?: string
  // Initial topo to load (topoSlug on the first topo chapter is used if omitted)
  topoSlug?: string
  chapters: TopoStoryChapter[]
}
