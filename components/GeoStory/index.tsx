'use client'

import { useRef, useEffect, useCallback, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import type { Story, MapChapter } from './types'
import TitleChapter from './TitleChapter'
import SplashChapter from './SplashChapter'
import GalleryChapter from './GalleryChapter'
import ArticleChapter from './ArticleChapter'
import VideoChapter from './VideoChapter'

export default function GeoStory({ story }: { story: Story }) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const chapterRefs = useRef<(HTMLDivElement | null)[]>([])
  const markersAdded = useRef<Set<string>>(new Set())
  const [mapLoaded, setMapLoaded] = useState(false)
  const [activeIdx, setActiveIdx] = useState(0)

  // Init map
  useEffect(() => {
    if (mapRef.current || !mapContainer.current) return

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: story.mapStyle,
      center: story.initialView.coordinates,
      zoom: story.initialView.zoom,
      pitch: story.initialView.pitch ?? 0,
      bearing: story.initialView.bearing ?? 0,
      scrollZoom: false,
      interactive: false,
    })

    map.on('load', () => {
      if (story.route && story.route.length >= 2) {
        map.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: { type: 'LineString', coordinates: [] },
          },
        })
        map.addLayer({
          id: 'route-line',
          type: 'line',
          source: 'route',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': '#dc2626', 'line-width': 2.5, 'line-opacity': 0.9 },
        })
        map.addLayer(
          {
            id: 'route-glow',
            type: 'line',
            source: 'route',
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: { 'line-color': '#dc2626', 'line-width': 8, 'line-opacity': 0.2, 'line-blur': 3 },
          },
          'route-line'
        )
      }
      setMapLoaded(true)
    })

    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [story])

  const applyChapter = useCallback(
    (chapter: (typeof story.chapters)[number]) => {
      const map = mapRef.current
      if (!map) return

      if (chapter.type === 'map') {
        map.flyTo({
          center: chapter.coordinates,
          zoom: chapter.zoom,
          pitch: chapter.pitch ?? 0,
          bearing: chapter.bearing ?? 0,
          duration: 2400,
          essential: true,
        })

        if (chapter.routeProgress !== undefined && story.route) {
          setRouteProgress(map, story.route, chapter.routeProgress)
        }

        if (chapter.marker && !markersAdded.current.has(chapter.id)) {
          markersAdded.current.add(chapter.id)
          const el = document.createElement('div')
          el.style.cssText =
            'width:10px;height:10px;border-radius:50%;background:#dc2626;border:2px solid white;box-shadow:0 0 0 2px rgba(220,38,38,0.3);'
          new mapboxgl.Marker({ element: el })
            .setLngLat(chapter.coordinates)
            .addTo(map)
        }
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

  const mapChapters = story.chapters.filter((c) => c.type === 'map') as MapChapter[]
  const activeMapChapter = story.chapters[activeIdx]
  const activeMapIdx =
    activeMapChapter?.type === 'map'
      ? mapChapters.findIndex((c) => c.id === activeMapChapter.id)
      : -1

  return (
    <div className="relative">
      {/* Sticky full-screen map */}
      <div className="sticky top-14 h-[calc(100vh-3.5rem)] w-full">
        <div ref={mapContainer} className="w-full h-full" />

        {mapChapters.length > 0 && (
          <div className="absolute right-5 top-1/2 -translate-y-1/2 flex flex-col gap-2.5 z-10">
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
            {/* ── Title ─────────────────────────────────────────────── */}
            {chapter.type === 'title' && (
              <TitleChapter chapter={chapter} />
            )}

            {/* ── Splash ────────────────────────────────────────────── */}
            {chapter.type === 'splash' && (
              <SplashChapter chapter={chapter} />
            )}

            {/* ── Map ───────────────────────────────────────────────── */}
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

            {/* ── Image (single full-screen) ────────────────────────── */}
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

            {/* ── Gallery ───────────────────────────────────────────── */}
            {chapter.type === 'gallery' && (
              <GalleryChapter chapter={chapter} />
            )}

            {/* ── Article ───────────────────────────────────────────── */}
            {chapter.type === 'article' && (
              <ArticleChapter chapter={chapter} />
            )}

            {/* ── Video ─────────────────────────────────────────────── */}
            {chapter.type === 'video' && (
              <VideoChapter chapter={chapter} />
            )}
          </div>
        ))}

        <div className="h-32 pointer-events-none" />
      </div>
    </div>
  )
}

function setRouteProgress(map: mapboxgl.Map, route: [number, number][], progress: number) {
  const source = map.getSource('route') as mapboxgl.GeoJSONSource
  if (!source) return
  const endIdx = Math.round((route.length - 1) * Math.min(progress, 1))
  const visible = route.slice(0, endIdx + 1)
  if (visible.length >= 2) {
    source.setData({
      type: 'Feature',
      properties: {},
      geometry: { type: 'LineString', coordinates: visible },
    })
  }
}
