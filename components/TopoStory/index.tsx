'use client'

import { useRef, useEffect, useState } from 'react'
import type { TopoStory, TopoStoryChapter, TopoChapter } from './types'
import type { TopoData, TopoFeatureRaw } from '../../lib/topo'
import { imageToLeaflet, lineStyle } from '../../lib/topo'
import PitchChapter from './PitchChapter'
import TitleChapter from '../GeoStory/TitleChapter'
import SplashChapter from '../GeoStory/SplashChapter'
import GalleryChapter from '../GeoStory/GalleryChapter'
import ArticleChapter from '../GeoStory/ArticleChapter'
import VideoChapter from '../GeoStory/VideoChapter'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function setRouteProgress(layer: any, allPts: any[], progress: number) {
  const end = Math.round((allPts.length - 1) * Math.min(Math.max(progress, 0), 1))
  layer.setLatLngs(allPts.slice(0, end + 1))
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function TopoStory({ story, topoData }: { story: TopoStory; topoData: TopoData }) {
  const mapRef        = useRef<HTMLDivElement>(null)
  const mapInst       = useRef<any>(null)
  const overlayRef    = useRef<any>(null)
  const routeLayerRef = useRef<any>(null)
  const routePtsRef   = useRef<any[]>([])
  const belayRefs     = useRef<Map<number, any>>(new Map())
  const chapterRefs   = useRef<(HTMLDivElement | null)[]>([])
  const [activeIdx, setActiveIdx] = useState(0)

  // Find the first topo chapter's slug (used if topoData is already provided)
  const topoChapters = story.chapters.filter((c): c is TopoChapter => c.type === 'topo')

  // ─── Init Leaflet map ─────────────────────────────────────────────────────

  useEffect(() => {
    if (!mapRef.current || mapInst.current) return
    const { w, h } = topoData.image

    import('leaflet').then(L => {
      if (!document.getElementById('lf-css')) {
        const link = document.createElement('link')
        link.id = 'lf-css'; link.rel = 'stylesheet'
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
        document.head.appendChild(link)
      }
      if (!document.getElementById('topo-story-css')) {
        const s = document.createElement('style'); s.id = 'topo-story-css'
        s.textContent = `
          .ts-belay{background:#1d4ed8;border:2px solid #fff;color:#fff;font-size:11px;font-weight:700;padding:1px 5px;border-radius:50%;min-width:20px;text-align:center;box-shadow:none}
          .ts-belay::before{display:none}
          .ts-belay-active{background:#dc2626!important;border-color:#fff!important;transform:scale(1.25);transition:transform 0.3s}
          .ts-ann{background:#78350f;border:1px solid #f59e0b;color:#fef3c7;font-size:11px;font-weight:500;padding:2px 6px;border-radius:4px;white-space:nowrap;box-shadow:none}
          .ts-ann::before{display:none}
          .leaflet-container{background:#111}
        `
        document.head.appendChild(s)
      }

      const bounds: [[number, number], [number, number]] = [[-h, 0], [0, w]]
      const map = L.map(mapRef.current!, {
        crs: L.CRS.Simple, minZoom: -3, maxZoom: 5, zoomSnap: 0.25,
        attributionControl: false, doubleClickZoom: false, scrollWheelZoom: false,
        dragging: false, keyboard: false, touchZoom: false, boxZoom: false,
      })

      const bgUrl = topoData.backgroundImage ?? 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQAABjE+ibYAAAAASUVORK5CYII='
      overlayRef.current = L.imageOverlay(bgUrl, bounds).addTo(map)

      // Custom panes — same z-order as editor
      map.createPane('rockPane').style.zIndex  = '401'
      map.createPane('routePane').style.zIndex = '450'
      map.createPane('pointPane').style.zIndex = '500'

      // Reconstruct all features
      topoData.features.forEach((f: TopoFeatureRaw, idx: number) => {
        if (f.type === 'rock' && f.points) {
          const pts = f.points.map(imageToLeaflet)
          L.polygon(pts, {
            color: '#292524', weight: 2.5, opacity: 0.9,
            fillColor: '#e7e5e4', fillOpacity: 0.7,
            pane: 'rockPane', interactive: false,
          }).addTo(map)

        } else if (f.type === 'topo-line' && f.points && f.style) {
          const pts = f.points.map(imageToLeaflet)
          L.polyline(pts, { ...lineStyle(f.style as any), pane: 'routePane', interactive: false }).addTo(map)

        } else if (f.type === 'route' && f.points) {
          const pts = f.points.map(imageToLeaflet)
          // Route starts empty and grows via routeProgress
          const layer = L.polyline([], { color: '#dc2626', weight: 3, opacity: 0.95, pane: 'routePane', interactive: false }).addTo(map)
          routeLayerRef.current = layer
          routePtsRef.current = pts

        } else if (f.type === 'belay' && f.position) {
          const latlng = imageToLeaflet(f.position)
          const pitch = f.pitch ?? idx
          const marker = L.circleMarker(latlng, {
            radius: 11, color: '#fff', fillColor: '#1d4ed8', fillOpacity: 1, weight: 2,
            pane: 'pointPane', interactive: false,
          })
          marker.bindTooltip(String(pitch), { permanent: true, direction: 'center', className: 'ts-belay' })
          marker.addTo(map)
          belayRefs.current.set(pitch, marker)

        } else if (f.type === 'annotation' && f.position) {
          const latlng = imageToLeaflet(f.position)
          const label = f.label ?? ''
          const marker = L.circleMarker(latlng, {
            radius: 5, color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: 1, weight: 2,
            pane: 'pointPane', interactive: false,
          })
          marker.bindTooltip(label, { permanent: true, direction: 'right', className: 'ts-ann' })
          marker.addTo(map)
        }
      })

      // Fit to full bounds initially
      map.fitBounds(bounds, { padding: [40, 40], animate: false })
      mapInst.current = map
    })

    return () => {
      if (mapInst.current) { mapInst.current.remove(); mapInst.current = null }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ─── Apply chapter when active index changes ──────────────────────────────

  useEffect(() => {
    const chapter = story.chapters[activeIdx]
    const map = mapInst.current
    if (!map || !chapter || chapter.type !== 'topo') return

    const [[x1, y1], [x2, y2]] = chapter.bounds
    const lBounds: [[number, number], [number, number]] = [[-y2, x1], [-y1, x2]]
    map.flyToBounds(lBounds, { duration: 1.2, easeLinearity: 0.3, padding: [40, 40] })

    overlayRef.current?.setOpacity(chapter.bgOpacity ?? 1)

    if (chapter.routeProgress !== undefined && routeLayerRef.current) {
      setRouteProgress(routeLayerRef.current, routePtsRef.current, chapter.routeProgress)
    }

    // Highlight the active belay
    belayRefs.current.forEach((marker, pitch) => {
      const tooltip = marker.getTooltip()
      const el = tooltip?.getElement()
      if (!el) return
      if (pitch === chapter.pitch) {
        el.classList.add('ts-belay-active')
      } else {
        el.classList.remove('ts-belay-active')
      }
    })
  }, [activeIdx, story.chapters])

  // ─── Scroll observer ─────────────────────────────────────────────────────

  useEffect(() => {
    const observers: IntersectionObserver[] = []
    story.chapters.forEach((_, i) => {
      const el = chapterRefs.current[i]
      if (!el) return
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveIdx(i) },
        { threshold: 0, rootMargin: '-45% 0px -45% 0px' }
      )
      obs.observe(el)
      observers.push(obs)
    })
    return () => observers.forEach(o => o.disconnect())
  }, [story.chapters])

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="relative">
      {/* Sticky topo map */}
      <div className="sticky top-14 h-[calc(100vh-3.5rem)] w-full">
        <div ref={mapRef} className="w-full h-full" />

        {/* Dot nav */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-[1000]">
          {story.chapters.map((_, i) => (
            <button
              key={i}
              onClick={() => chapterRefs.current[i]?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
              className={`w-2 h-2 rounded-full transition-all ${i === activeIdx ? 'bg-white scale-125' : 'bg-white/40 hover:bg-white/70'}`}
            />
          ))}
        </div>
      </div>

      {/* Chapters — overlap via negative margin */}
      <div className="-mt-[calc(100vh-3.5rem)] relative">
        {story.chapters.map((chapter, i) => (
          <div key={chapter.id} ref={el => { chapterRefs.current[i] = el }}>
            {chapter.type === 'topo'    && <PitchChapter chapter={chapter as TopoChapter} />}
            {chapter.type === 'title'   && <TitleChapter chapter={chapter as any} />}
            {chapter.type === 'splash'  && <SplashChapter chapter={chapter as any} />}
            {chapter.type === 'gallery' && <GalleryChapter chapter={chapter as any} />}
            {chapter.type === 'article' && <ArticleChapter chapter={chapter as any} />}
            {chapter.type === 'video'   && <VideoChapter chapter={chapter as any} />}
          </div>
        ))}
      </div>
    </div>
  )
}
