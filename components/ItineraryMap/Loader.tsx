'use client'

import dynamic from 'next/dynamic'
import type { ItineraryStop } from '@/lib/posts'

const ItineraryMap = dynamic(() => import('./index'), { ssr: false })

export default function ItineraryMapLoader({ stops }: { stops: ItineraryStop[] }) {
  return <ItineraryMap stops={stops} />
}
