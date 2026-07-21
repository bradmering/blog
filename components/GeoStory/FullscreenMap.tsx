'use client'

import { useRef, useEffect, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import type { Story, ImagePin, Chapter } from './types'
import Lightbox from './Lightbox'

/** Chapters that carry a coordinate get a numbered stop marker. */
function stopChapters(chapters: Chapter[]) {
  return chapters.filter(
    (c): c is Extract<Chapter, { coordinates: [number, number] }> =>
      (c.type === 'article' || c.type === 'map') && 'coordinates' in c
  )
}

/**
 * Standalone, fully interactive route map — drag to pan, pinch or use the
 * zoom buttons, tap a photo pin to open it. The story's inline map is
 * deliberately non-interactive (scroll drives the camera), so this is the
 * escape hatch for actually exploring the route.
 */
export default function FullscreenMap({
  story,
  onClose,
}: {
  story: Story
  onClose: () => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const [pinLightbox, setPinLightbox] = useState<ImagePin | null>(null)

  // Escape closes, and the page behind stays put while the map is open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose])

  useEffect(() => {
    if (mapRef.current || !containerRef.current) return

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: story.mapStyle ?? 'mapbox://styles/mapbox/satellite-streets-v12',
      center: story.initialView.coordinates,
      zoom: story.initialView.zoom,
      interactive: true,
      // Keep north up — free rotation is easy to trigger by accident with two
      // fingers and leaves people lost with no obvious way back.
      dragRotate: false,
      pitchWithRotate: false,
    })
    map.touchZoomRotate.disableRotation()

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right')
    map.addControl(new mapboxgl.ScaleControl({ unit: 'imperial' }), 'bottom-left')

    map.on('load', () => {
      if (story.route && story.route.length >= 2) {
        map.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: { type: 'LineString', coordinates: story.route },
          },
        })
        map.addLayer({
          id: 'route-glow',
          type: 'line',
          source: 'route',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: {
            'line-color': '#ef4444',
            'line-width': 16,
            'line-opacity': 0.25,
            'line-blur': 6,
          },
        })
        map.addLayer({
          id: 'route-line',
          type: 'line',
          source: 'route',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': '#dc2626', 'line-width': 4.5, 'line-opacity': 0.95 },
        })

        const bounds = new mapboxgl.LngLatBounds(story.route[0], story.route[0])
        for (const c of story.route) bounds.extend(c)
        const narrow = window.innerWidth < 640
        map.fitBounds(bounds, {
          padding: narrow
            ? { top: 80, bottom: 90, left: 30, right: 30 }
            : { top: 90, bottom: 90, left: 60, right: 60 },
          duration: 0,
        })
      }

      // Numbered stops, so the standalone map reads as a route and not just
      // a line — tap for the chapter heading.
      stopChapters(story.chapters).forEach((c, i) => {
        const el = document.createElement('div')
        el.style.cssText = `
          width:22px; height:22px; border-radius:50%;
          background:#dc2626; border:2px solid white;
          box-shadow:0 1px 4px rgba(0,0,0,0.5);
          color:white; font-size:11px; font-weight:700;
          display:flex; align-items:center; justify-content:center;
          font-family: system-ui, sans-serif; cursor:pointer;
        `
        el.textContent = String(i + 1)
        new mapboxgl.Marker({ element: el })
          .setLngLat(c.coordinates)
          .setPopup(
            new mapboxgl.Popup({ offset: 16, closeButton: false }).setText(c.heading)
          )
          .addTo(map)
      })

      // Photo pins. The visible thumbnail stays 34px, but the marker element
      // is padded out to a 44px touch target so they're tappable on a phone.
      if (story.imagePins) {
        for (const pin of story.imagePins) {
          const el = document.createElement('div')
          el.style.cssText =
            'width:44px;height:44px;display:flex;align-items:center;justify-content:center;cursor:pointer;'

          const inner = document.createElement('div')
          inner.style.cssText = `
            width:34px; height:34px; border-radius:50%;
            background-image: url('${pin.thumbnail}');
            background-size: cover; background-position: center;
            border: 2px solid white; box-shadow: 0 1px 5px rgba(0,0,0,0.55);
          `
          el.appendChild(inner)
          el.addEventListener('click', () => setPinLightbox(pin))

          new mapboxgl.Marker({ element: el }).setLngLat(pin.coordinates).addTo(map)
        }
      }

      map.resize()
    })

    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [story])

  return (
    <div className="fixed inset-0 z-[60] bg-black">
      {/* w/h-full rather than `absolute inset-0`: mapbox-gl.css forces
          `position: relative` onto .mapboxgl-map, which would override the
          absolute positioning and collapse the container to zero height. */}
      <div ref={containerRef} className="w-full h-full" />

      <div className="absolute top-0 left-0 right-0 flex items-start justify-between gap-3 p-4 pointer-events-none">
        <div className="pointer-events-auto bg-black/65 backdrop-blur-sm text-white rounded-lg px-3.5 py-2 max-w-[60%]">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/50">
            Route map
          </p>
          <p className="text-sm font-semibold truncate">{story.title}</p>
        </div>

        <button
          onClick={onClose}
          className="pointer-events-auto flex items-center gap-1.5 bg-black/65 hover:bg-black/85 backdrop-blur-sm text-white rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors"
          aria-label="Close map"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
          Close
        </button>
      </div>

      {pinLightbox && (
        <Lightbox
          images={[{ src: pinLightbox.image, caption: pinLightbox.caption }]}
          index={0}
          onClose={() => setPinLightbox(null)}
          onNav={() => {}}
        />
      )}
    </div>
  )
}
