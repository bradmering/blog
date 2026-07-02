'use client'

import { useRef, useEffect, useCallback, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Story, MapChapter } from './types'
import TitleChapter from './TitleChapter'
import SplashChapter from './SplashChapter'
import GalleryChapter from './GalleryChapter'
import ArticleChapter from './ArticleChapter'
import VideoChapter from './VideoChapter'

// Data is stored [lng, lat] (Mapbox convention); Leaflet wants [lat, lng]
function ll([lng, lat]: [number, number]): [number, number] {
  return [lat, lng]
}

export default function GeoStory({ story }: { story: Story }) {
  const mapContainer  = useRef<HTMLDivElement>(null)
  const mapRef        = useRef<L.Map | null>(null)
  const routeLayerRef = useRef<L.Polyline | null>(null)
  const glowLayerRef  = useRef<L.Polyline | null>(null)
  const chapterRefs   = useRef<(HTMLDivElement | null)[]>([])
  const markersAdded  = useRef<Set<string>>(new Set())
  const [mapLoaded, setMapLoaded] = useState(false)
  const [activeIdx, setActiveIdx] = useState(0)

  useEffect(() => {
    if (mapRef.current || !mapContainer.current) return

    const [lng, lat] = story.initialView.coordinates
    const map = L.map(mapContainer.current, {
      center: [lat, lng],
      zoom: story.initialView.zoom,
      scrollWheelZoom: false,
      dragging:        false,
      zoomControl:     false,
      attributionControl: true,
      keyboard:        false,
      doubleClickZoom: false,
      touchZoom:       false,
      boxZoom:         false,
    })

    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      { attribution: 'Tiles &copy; Esri', maxZoom: 17 }
    ).addTo(map)

    if (story.route && story.route.length >= 2) {
      glowLayerRef.current = L.polyline([], {
        color: '#dc2626', weight: 8, opacity: 0.2, interactive: false,
      }).addTo(map)
      routeLayerRef.current = L.polyline([], {
        color: '#dc2626', weight: 2.5, opacity: 0.9, interactive: false,
      }).addTo(map)
    }

    mapRef.current = map
    setMapLoaded(true)

    return () => {
      map.remove()
      mapRef.current        = null
      routeLayerRef.current = null
      glowLayerRef.current  = null
    }
  }, [story])

  const applyChapter = useCallback(
    (chapter: (typeof story.chapters)[number]) => {
      const map = mapRef.current
      if (!map || chapter.type !== 'map') return

      map.flyTo(ll(chapter.coordinates), chapter.zoom, {
        duration: 2.4,
        easeLinearity: 0.3,
      })

      if (chapter.routeProgress !== undefined && story.route) {
        setRouteProgress(
          routeLayerRef.current,
          glowLayerRef.current,
          story.route,
          chapter.routeProgress
        )
      }

      if (chapter.marker && !markersAdded.current.has(chapter.id)) {
        markersAdded.current.add(chapter.id)
        L.circleMarker(ll(chapter.coordinates), {
          radius: 5,
          color: 'white', weight: 2,
          fillColor: '#dc2626', fillOpacity: 1,
          interactive: false,
        }).addTo(map)
      }
    },
    [story]
  )

  useEffect(() => {
    if (!mapLoaded) return
    applyChapter(story.chapters[activeIdx])
  }, [mapLoaded, activeIdx, applyChapter, story.chapters])

  useEffect(() => {
    const observers: IntersectionObserver[] = []
    chapterRefs.current.forEach((ref, i) => {
      if (!ref) return
      const observer = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveIdx(i) },
        { threshold: 0, rootMargin: '-45% 0px -45% 0px' }
      )
      observer.observe(ref)
      observers.push(observer)
    })
    return () => observers.forEach((o) => o.disconnect())
  }, [])

  const mapChapters    = story.chapters.filter((c) => c.type === 'map') as MapChapter[]
  const activeMapChapter = story.chapters[activeIdx]
  const activeMapIdx   =
    activeMapChapter?.type === 'map'
      ? mapChapters.findIndex((c) => c.id === activeMapChapter.id)
      : -1

  return (
    <div className="relative">
      {/* Sticky full-screen map */}
      <div className="sticky top-14 h-[calc(100vh-3.5rem)] w-full">
        <div ref={mapContainer} className="w-full h-full" />

        {mapChapters.length > 0 && (
          <div className="absolute right-5 top-1/2 -translate-y-1/2 flex flex-col gap-2.5 z-[1000]">
            {mapChapters.map((c, i) => (
              <div
                key={c.id}
                className={`rounded-full transition-all duration-300 ${
                  activeMapIdx === i
                    ? 'w-2.5 h-2.5 bg-white shadow-lg'
                    : 'w-1.5 h-1.5 bg-white/40'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Chapters — overlap the map via negative margin */}
      <div className="-mt-[calc(100vh-3.5rem)] relative">
        {story.chapters.map((chapter, i) => (
          <div
            key={chapter.id}
            ref={(el) => { chapterRefs.current[i] = el }}
          >
            {chapter.type === 'title' && <TitleChapter chapter={chapter} />}
            {chapter.type === 'splash' && <SplashChapter chapter={chapter} />}

            {chapter.type === 'map' && (
              <div
                className={`min-h-[85vh] flex items-center py-20 pointer-events-none ${
                  chapter.align === 'right'
                    ? 'justify-end pr-8 sm:pr-14'
                    : 'justify-start pl-8 sm:pl-14'
                }`}
              >
                <div className="pointer-events-auto bg-white/75 backdrop-blur-sm shadow-lg max-w-xl w-full p-6">
                  {chapter.subheading && (
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-400 mb-2">
                      {chapter.subheading}
                    </p>
                  )}
                  <h2 className="text-xl font-bold text-stone-900 mb-3 leading-snug tracking-tight">
                    {chapter.heading}
                  </h2>
                  {chapter.textHtml ? (
                    <div
                      className="prose prose-sm prose-stone max-w-none"
                      dangerouslySetInnerHTML={{ __html: chapter.textHtml }}
                    />
                  ) : (
                    <p className="text-sm text-stone-600 leading-relaxed">{chapter.text}</p>
                  )}
                </div>
              </div>
            )}

            {chapter.type === 'image' && (
              <div className="relative h-screen z-10">
                <img
                  src={chapter.image}
                  alt={chapter.caption ?? ''}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/55" />
                {chapter.caption && (
                  <p className="absolute bottom-10 left-0 right-0 text-center text-white/75 text-sm italic px-10 max-w-xl mx-auto">
                    {chapter.caption}
                  </p>
                )}
              </div>
            )}

            {chapter.type === 'gallery'  && <GalleryChapter chapter={chapter} />}
            {chapter.type === 'article'  && <ArticleChapter chapter={chapter} />}
            {chapter.type === 'video'    && <VideoChapter chapter={chapter} />}
          </div>
        ))}

        <div className="h-32 pointer-events-none" />
      </div>
    </div>
  )
}

function setRouteProgress(
  routeLayer: L.Polyline | null,
  glowLayer:  L.Polyline | null,
  route:      [number, number][],
  progress:   number
) {
  if (!routeLayer) return
  const endIdx  = Math.round((route.length - 1) * Math.min(progress, 1))
  const visible = route.slice(0, endIdx + 1).map(ll)
  if (visible.length >= 2) {
    routeLayer.setLatLngs(visible)
    glowLayer?.setLatLngs(visible)
  }
}
