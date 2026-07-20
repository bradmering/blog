'use client'

import { useRef, useEffect, useCallback, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import type {
  Story,
  MapChapter,
  ArticleChapter as ArticleChapterType,
  OverviewChapter as OverviewChapterType,
  ImagePin,
} from './types'
import TitleChapter from './TitleChapter'
import SplashChapter from './SplashChapter'
import GalleryChapter from './GalleryChapter'
import ArticleChapter from './ArticleChapter'
import VideoChapter from './VideoChapter'
import ParallaxVideoChapter from './ParallaxVideoChapter'
import LogisticsChapter from './LogisticsChapter'
import Lightbox from './Lightbox'
import Reveal from './Reveal'
import ReadingProgress from './ReadingProgress'
import ChapterNav from './ChapterNav'

type MapDriving = MapChapter | ArticleChapterType | OverviewChapterType

function isMapDriving(chapter: Story['chapters'][number]): chapter is MapDriving {
  return chapter.type === 'map' || chapter.type === 'article' || chapter.type === 'overview'
}

const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

export default function GeoStory({ story }: { story: Story }) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const chapterRefs = useRef<(HTMLDivElement | null)[]>([])
  const markersAdded = useRef<Set<string>>(new Set())
  const rafRef = useRef<number | null>(null)
  const progressRef = useRef(0)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [activeIdx, setActiveIdx] = useState(0)
  const [pinLightbox, setPinLightbox] = useState<ImagePin | null>(null)

  // Tween the drawn route forward instead of snapping — the path animates
  // ahead as the camera flies to each day.
  const animateRoute = useCallback(
    (map: mapboxgl.Map, route: [number, number][], target: number) => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      const start = progressRef.current
      const delta = target - start
      if (Math.abs(delta) < 0.0005) {
        progressRef.current = target
        setRouteProgress(map, route, target)
        return
      }
      const startT = performance.now()
      const dur = 1600
      const ease = (t: number) => 1 - Math.pow(1 - t, 3) // easeOutCubic
      const step = (now: number) => {
        const t = Math.min((now - startT) / dur, 1)
        const p = start + delta * ease(t)
        progressRef.current = p
        setRouteProgress(map, route, p)
        if (t < 1) rafRef.current = requestAnimationFrame(step)
        else rafRef.current = null
      }
      rafRef.current = requestAnimationFrame(step)
    },
    []
  )

  // Init map
  useEffect(() => {
    if (mapRef.current || !mapContainer.current) return

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: story.mapStyle ?? 'mapbox://styles/mapbox/satellite-streets-v12',
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
        map.addLayer(
          {
            id: 'route-glow',
            type: 'line',
            source: 'route',
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: { 'line-color': '#ef4444', 'line-width': 16, 'line-opacity': 0.25, 'line-blur': 6 },
          }
        )
        map.addLayer({
          id: 'route-line',
          type: 'line',
          source: 'route',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': '#dc2626', 'line-width': 4.5, 'line-opacity': 0.95 },
        })
      }

      // Strava-style photo pins — small circular thumbnails, always visible.
      // Mapbox positions the marker root via its own inline `transform`, so we
      // never touch the root's transform — the hover scale lives on an inner
      // element to avoid clobbering the marker's placement.
      if (story.imagePins) {
        for (const pin of story.imagePins) {
          const el = document.createElement('div')
          el.style.cssText = 'width:34px;height:34px;cursor:pointer;'

          const inner = document.createElement('div')
          inner.style.cssText = `
            width:100%; height:100%; border-radius:50%;
            background-image: url('${pin.thumbnail}');
            background-size: cover; background-position: center;
            border: 2px solid white; box-shadow: 0 1px 5px rgba(0,0,0,0.55);
            transition: transform 0.2s ease, box-shadow 0.2s ease;
          `
          el.appendChild(inner)

          el.addEventListener('mouseenter', () => {
            inner.style.transform = 'scale(1.25)'
            inner.style.boxShadow = '0 2px 10px rgba(0,0,0,0.6)'
            el.style.zIndex = '10'
          })
          el.addEventListener('mouseleave', () => {
            inner.style.transform = 'scale(1)'
            inner.style.boxShadow = '0 1px 5px rgba(0,0,0,0.55)'
            el.style.zIndex = ''
          })
          el.addEventListener('click', () => setPinLightbox(pin))

          new mapboxgl.Marker({ element: el })
            .setLngLat(pin.coordinates)
            .addTo(map)
        }
      }

      setMapLoaded(true)
    })

    mapRef.current = map
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      map.remove()
      mapRef.current = null
    }
  }, [story])

  const applyChapter = useCallback(
    (chapter: Story['chapters'][number]) => {
      const map = mapRef.current
      if (!map || !isMapDriving(chapter)) return

      // Whole-route overview — fit the entire traverse in view
      if (chapter.type === 'overview') {
        if (story.route && story.route.length >= 2) {
          const bounds = new mapboxgl.LngLatBounds(story.route[0], story.route[0])
          for (const c of story.route) bounds.extend(c)
          map.fitBounds(bounds, {
            padding: { top: 90, bottom: 90, left: 60, right: 60 },
            pitch: 0,
            bearing: 0,
            duration: 3000,
            essential: true,
          })
          animateRoute(map, story.route, 1)
        }
        return
      }

      map.flyTo({
        center: chapter.coordinates,
        zoom: chapter.zoom,
        pitch: chapter.pitch ?? 0,
        bearing: chapter.bearing ?? 0,
        duration: 3000,
        curve: 1.4,
        easing: easeInOutCubic,
        essential: true,
      })

      if (chapter.routeProgress !== undefined && story.route) {
        animateRoute(map, story.route, chapter.routeProgress)
      }

      if (chapter.marker && !markersAdded.current.has(chapter.id)) {
        markersAdded.current.add(chapter.id)
        const el = document.createElement('div')
        el.style.cssText =
          'width:12px;height:12px;border-radius:50%;background:#dc2626;border:2px solid white;box-shadow:0 0 0 3px rgba(220,38,38,0.3);'
        new mapboxgl.Marker({ element: el })
          .setLngLat(chapter.coordinates)
          .addTo(map)
      }
    },
    [story, animateRoute]
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
        // Activate earlier — a chapter takes over as its top nears the upper
        // third of the viewport, so the map leads the reading.
        { threshold: 0, rootMargin: '-8% 0px -70% 0px' }
      )
      observer.observe(ref)
      observers.push(observer)
    })

    return () => observers.forEach((o) => o.disconnect())
  }, [])

  const mapChapters = story.chapters.filter(isMapDriving)
  const activeChapter = story.chapters[activeIdx]
  const activeMapIdx = isMapDriving(activeChapter)
    ? mapChapters.findIndex((c) => c.id === activeChapter.id)
    : -1

  const logisticsChapter = story.chapters.find((c) => c.type === 'logistics')
  const overviewChapter = story.chapters.find((c) => c.type === 'overview')

  const jumpLinks = [
    overviewChapter && { label: 'Jump to map', href: `#${overviewChapter.id}` },
    logisticsChapter && { label: 'Jump to logistics', href: `#${logisticsChapter.id}` },
  ].filter(Boolean) as { label: string; href: string }[]

  return (
    <div className="relative">
      <ReadingProgress />

      {/* Sticky full-screen map */}
      <div className="sticky top-14 h-[calc(100vh-3.5rem)] w-full">
        <div ref={mapContainer} className="w-full h-full" />

        {mapChapters.length > 0 && (
          <div className="absolute right-5 top-1/2 -translate-y-1/2 flex flex-col gap-2.5 z-10">
            {mapChapters.map((c, i) => (
              <div
                key={c.id}
                className={`rounded-full transition-all duration-500 ease-out ${
                  activeMapIdx === i
                    ? 'w-2.5 h-2.5 bg-white shadow-lg'
                    : 'w-1.5 h-1.5 bg-white/40'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Chapters — overlap the map via negative margin. The wrapper is
          click-through so exposed map areas (gaps) reach the pins; each
          chapter's own content re-enables pointer events. */}
      <div className="-mt-[calc(100vh-3.5rem)] relative pointer-events-none">
        {story.chapters.map((chapter, i) => (
          <div
            key={chapter.id}
            id={chapter.id}
            className="scroll-mt-14 pointer-events-none"
            ref={(el) => { chapterRefs.current[i] = el }}
          >
            {/* ── Title ─────────────────────────────────────────────── */}
            {chapter.type === 'title' && (
              <TitleChapter chapter={chapter} jumpLinks={jumpLinks} />
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
              <div className="relative h-screen z-10 pointer-events-auto">
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
              <>
                <ArticleChapter chapter={chapter} />
                {/* Transparent gap — reveals the sticky map (already flown to
                    this chapter's coordinates/route) between day narratives.
                    Tall enough to dwell on the map and click its photo pins. */}
                {'coordinates' in chapter && (
                  <div style={{ height: '110vh', width: '100%', pointerEvents: 'none' }} aria-hidden="true" />
                )}
              </>
            )}

            {/* ── Overview (whole-route view) ───────────────────────── */}
            {chapter.type === 'overview' && (
              <div className="min-h-screen flex items-center justify-start py-24 pl-8 sm:pl-14 pointer-events-none">
                <Reveal className="pointer-events-auto bg-white/60 backdrop-blur-xl shadow-2xl shadow-black/10 ring-1 ring-white/40 max-w-sm w-full mr-6 p-8 text-left rounded-2xl">
                  {chapter.subheading && (
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-400 mb-2">
                      {chapter.subheading}
                    </p>
                  )}
                  {chapter.heading && (
                    <h2 className="text-2xl font-bold text-stone-900 mb-3 leading-snug tracking-tight">
                      {chapter.heading}
                    </h2>
                  )}
                  {chapter.textHtml ? (
                    <div
                      className="prose prose-sm prose-stone max-w-none"
                      dangerouslySetInnerHTML={{ __html: chapter.textHtml }}
                    />
                  ) : (
                    chapter.text && <p className="text-sm text-stone-600 leading-relaxed">{chapter.text}</p>
                  )}
                </Reveal>
              </div>
            )}

            {/* ── Video ─────────────────────────────────────────────── */}
            {chapter.type === 'video' && (
              <VideoChapter chapter={chapter} />
            )}

            {/* ── Parallax video ────────────────────────────────────── */}
            {chapter.type === 'parallax-video' && (
              <ParallaxVideoChapter chapter={chapter} />
            )}

            {/* ── Logistics ─────────────────────────────────────────── */}
            {chapter.type === 'logistics' && (
              <LogisticsChapter chapter={chapter} />
            )}
          </div>
        ))}

        <div className="h-32 pointer-events-none" />
      </div>

      {pinLightbox && (
        <Lightbox
          images={[{ src: pinLightbox.image, caption: pinLightbox.caption }]}
          index={0}
          onClose={() => setPinLightbox(null)}
          onNav={() => {}}
        />
      )}

      <ChapterNav chapters={story.chapters} activeIdx={activeIdx} />
    </div>
  )
}

function setRouteProgress(map: mapboxgl.Map, route: [number, number][], progress: number) {
  const source = map.getSource('route') as mapboxgl.GeoJSONSource
  if (!source) return
  const endIdx = Math.round((route.length - 1) * Math.min(Math.max(progress, 0), 1))
  const visible = route.slice(0, endIdx + 1)
  if (visible.length >= 2) {
    source.setData({
      type: 'Feature',
      properties: {},
      geometry: { type: 'LineString', coordinates: visible },
    })
  }
}
