'use client'

import { useRef, useEffect, useState, useMemo, useCallback } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import type { ItineraryStop } from '@/lib/posts'

export default function ItineraryMap({ stops }: { stops: ItineraryStop[] }) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const stopRefs = useRef<(HTMLDivElement | null)[]>([])
  const [activeIdx, setActiveIdx] = useState(0)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)

  const openLightbox = useCallback((src: string) => setLightboxSrc(src), [])
  const closeLightbox = useCallback(() => setLightboxSrc(null), [])

  // Close on ESC
  useEffect(() => {
    if (!lightboxSrc) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeLightbox() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [lightboxSrc, closeLightbox])

  // Full polyline: stop coord → routePoints → next stop coord → ...
  const fullRoute = useMemo<[number, number][]>(() => {
    const pts: [number, number][] = []
    stops.forEach((s) => {
      pts.push(s.coordinates as [number, number])
      if (s.routePoints) pts.push(...(s.routePoints as [number, number][]))
    })
    return pts
  }, [stops])

  // Init map once
  useEffect(() => {
    if (mapRef.current || !mapContainer.current) return

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

    const bounds = fullRoute.reduce(
      (b, c) => b.extend(c),
      new mapboxgl.LngLatBounds(fullRoute[0], fullRoute[0])
    )

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      bounds,
      fitBoundsOptions: { padding: { top: 80, bottom: 80, left: 60, right: 60 } },
      scrollZoom: false,
      interactive: false,
    })

    map.on('load', () => {
      // Full route line — always visible
      map.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: { type: 'LineString', coordinates: fullRoute },
        },
      })
      map.addLayer({
        id: 'route-glow',
        type: 'line',
        source: 'route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#ef4444', 'line-width': 8, 'line-opacity': 0.18, 'line-blur': 4 },
      })
      map.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#ef4444', 'line-width': 2, 'line-opacity': 0.9 },
      })

      // Stop markers as a GL layer
      map.addSource('stops', {
        type: 'geojson',
        data: buildStopsGeoJSON(stops, 0),
      })
      map.addLayer({
        id: 'stop-halo',
        type: 'circle',
        source: 'stops',
        paint: {
          'circle-radius': ['case', ['get', 'active'], 14, 0],
          'circle-color': '#ef4444',
          'circle-opacity': 0.2,
        },
      })
      map.addLayer({
        id: 'stop-dot',
        type: 'circle',
        source: 'stops',
        paint: {
          'circle-radius': ['case', ['get', 'active'], 7, 4],
          'circle-color': ['case', ['get', 'active'], '#ef4444', '#ffffff'],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ef4444',
        },
      })

      setMapLoaded(true)
    })

    mapRef.current = map
    return () => { map.remove(); mapRef.current = null }
  }, [stops, fullRoute])

  // On active stop change: update marker + fly to stop
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return
    const map = mapRef.current

    const src = map.getSource('stops') as mapboxgl.GeoJSONSource
    src?.setData(buildStopsGeoJSON(stops, activeIdx))

    const stop = stops[activeIdx]
    map.flyTo({
      center: stop.coordinates as [number, number],
      zoom: stop.zoom ?? 10,
      pitch: stop.pitch ?? 30,
      bearing: 0,
      duration: 1800,
      essential: true,
    })
  }, [mapLoaded, activeIdx, stops])

  // Intersection observer
  useEffect(() => {
    const observers: IntersectionObserver[] = []
    stopRefs.current.forEach((ref, i) => {
      if (!ref) return
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveIdx(i) },
        { threshold: 0, rootMargin: '-40% 0px -40% 0px' }
      )
      obs.observe(ref)
      observers.push(obs)
    })
    return () => observers.forEach((o) => o.disconnect())
  }, [])

  return (
    <>
      <section className="relative flex flex-col lg:flex-row border-t border-b border-stone-100 bg-white">
        {/* ── Timeline ── */}
        <div className="order-2 lg:order-1 flex-1 py-12 px-8 sm:px-12 lg:px-14 xl:px-20">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-400 mb-10">
            Itinerary
          </p>

          <div className="relative">
            {stops.map((stop, i) => (
              <div
                key={stop.id}
                ref={(el) => { stopRefs.current[i] = el }}
                className="flex gap-5"
              >
                <div className="flex flex-col items-center flex-shrink-0 w-3">
                  <div className={`w-3 h-3 rounded-full border-2 flex-shrink-0 transition-all duration-300 ${
                    i === activeIdx ? 'bg-red-500 border-red-500 scale-110' : 'bg-white border-stone-300'
                  }`} />
                  {i < stops.length - 1 && (
                    <div className="flex-1 w-px bg-stone-200 mt-2 min-h-[280px]" />
                  )}
                </div>

                <div className={`flex-1 pb-12 transition-opacity duration-300 ${
                  i === activeIdx ? 'opacity-100' : 'opacity-35'
                }`}>
                  {stop.dates && (
                    <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-stone-400 mb-1 -mt-0.5">
                      {stop.dates}
                    </p>
                  )}
                  <h3 className="text-lg font-bold text-stone-900 mb-2 leading-tight tracking-tight">
                    {stop.name}
                  </h3>
                  {stop.description && (
                    <p className="text-sm text-stone-500 leading-relaxed max-w-lg mb-4">
                      {stop.description}
                    </p>
                  )}
                  {stop.image && (
                    <button
                      onClick={() => openLightbox(stop.image!)}
                      className="block w-full max-w-sm rounded-lg overflow-hidden ring-1 ring-stone-200 hover:ring-red-400 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                      aria-label={`View satellite image of ${stop.name}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={stop.image}
                        alt={`Satellite view of ${stop.name}`}
                        className="w-full aspect-video object-cover"
                        loading="lazy"
                      />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Map ── */}
        <div className="order-1 lg:order-2 lg:w-[48%] h-[40vh] lg:h-auto">
          <div className="sticky top-14 h-[40vh] lg:h-[calc(100vh-3.5rem)]">
            <div ref={mapContainer} className="w-full h-full" />
            <div className="absolute bottom-5 left-5 bg-black/50 backdrop-blur-sm text-white text-xs font-medium px-3 py-1.5 rounded-full pointer-events-none">
              {activeIdx + 1} / {stops.length}
            </div>
          </div>
        </div>
      </section>

      {/* ── Lightbox ── */}
      {lightboxSrc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={closeLightbox}
        >
          <button
            className="absolute top-4 right-5 text-white/70 hover:text-white text-3xl leading-none transition-colors"
            onClick={closeLightbox}
            aria-label="Close"
          >
            ×
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxSrc}
            alt=""
            className="max-w-[92vw] max-h-[88vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  )
}

function buildStopsGeoJSON(stops: ItineraryStop[], activeIdx: number): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: stops.map((stop, i) => ({
      type: 'Feature',
      properties: { active: i === activeIdx },
      geometry: { type: 'Point', coordinates: stop.coordinates },
    })),
  }
}
