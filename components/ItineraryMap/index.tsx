'use client'

import { useRef, useEffect, useState, useMemo } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import type { ItineraryStop } from '@/lib/posts'

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
}

export default function ItineraryMap({ stops }: { stops: ItineraryStop[] }) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const stopRefs = useRef<(HTMLDivElement | null)[]>([])
  const animFrameRef = useRef<number | null>(null)
  const visibleEndRef = useRef(0)
  const [activeIdx, setActiveIdx] = useState(0)
  const [mapLoaded, setMapLoaded] = useState(false)

  // Full polyline + index at which each stop's segment ends
  const { fullRoute, segEndIndices } = useMemo(() => {
    const fullRoute: [number, number][] = []
    const segEndIndices: number[] = []
    stops.forEach((stop) => {
      fullRoute.push(stop.coordinates as [number, number])
      if (stop.routePoints) fullRoute.push(...(stop.routePoints as [number, number][]))
      segEndIndices.push(fullRoute.length - 1)
    })
    return { fullRoute, segEndIndices }
  }, [stops])

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
      const initialEnd = segEndIndices[0]
      visibleEndRef.current = initialEnd

      // ── Route line ──────────────────────────────────────────
      map.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: fullRoute.slice(0, Math.max(initialEnd + 1, 2)),
          },
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
        paint: { 'line-color': '#ef4444', 'line-width': 2, 'line-opacity': 0.85 },
      })

      // ── Stop markers as a GL layer (stays fixed during camera moves) ──
      map.addSource('stops', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: stops.map((stop, i) => ({
            type: 'Feature',
            properties: { idx: i, active: i === 0 },
            geometry: { type: 'Point', coordinates: stop.coordinates },
          })),
        },
      })
      map.addLayer({
        id: 'stop-halo',
        type: 'circle',
        source: 'stops',
        paint: {
          'circle-radius': 10,
          'circle-color': '#ef4444',
          'circle-opacity': 0.2,
        },
      })
      map.addLayer({
        id: 'stop-dot',
        type: 'circle',
        source: 'stops',
        paint: {
          'circle-radius': ['case', ['get', 'active'], 6, 4],
          'circle-color': ['case', ['get', 'active'], '#ef4444', '#ffffff'],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ef4444',
        },
      })

      // Fly to first stop
      map.flyTo({
        center: stops[0].coordinates as [number, number],
        zoom: stops[0].zoom ?? 10,
        pitch: stops[0].pitch ?? 30,
        bearing: 0,
        duration: 1200,
        essential: true,
      })

      setMapLoaded(true)
    })

    mapRef.current = map
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      map.remove()
      mapRef.current = null
    }
  }, [stops, fullRoute, segEndIndices])

  // Animate route + camera tracking the route tip
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return
    const map = mapRef.current
    const routeSource = map.getSource('route') as mapboxgl.GeoJSONSource
    const stopsSource = map.getSource('stops') as mapboxgl.GeoJSONSource
    if (!routeSource || !stopsSource) return

    // Update active marker
    stopsSource.setData({
      type: 'FeatureCollection',
      features: stops.map((stop, i) => ({
        type: 'Feature',
        properties: { idx: i, active: i === activeIdx },
        geometry: { type: 'Point', coordinates: stop.coordinates },
      })),
    })

    const fromIdx = visibleEndRef.current
    const toIdx = segEndIndices[activeIdx]
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)

    // No route travel needed — just fly to this stop
    if (fromIdx === toIdx) {
      const stop = stops[activeIdx]
      map.flyTo({
        center: stop.coordinates as [number, number],
        zoom: stop.zoom ?? 10,
        pitch: stop.pitch ?? 30,
        bearing: 0,
        duration: 1000,
        essential: true,
      })
      return
    }

    // Determine zoom/pitch for camera: lerp from origin stop to destination stop
    const destStop = stops[activeIdx]
    const originStop = toIdx > fromIdx
      ? stops[Math.max(0, activeIdx - 1)]
      : stops[Math.min(stops.length - 1, activeIdx + 1)]
    const fromZoom = originStop.zoom ?? 10
    const toZoom = destStop.zoom ?? 10
    const fromPitch = originStop.pitch ?? 30
    const toPitch = destStop.pitch ?? 30

    const startTime = performance.now()
    const duration = 2000

    const step = (now: number) => {
      const t = Math.min((now - startTime) / duration, 1)
      const eased = easeInOut(t)

      // Fractional position along the route — interpolate between integer indices
      const frac = fromIdx + (toIdx - fromIdx) * eased
      const lo = Math.floor(frac)
      const hi = Math.min(lo + 1, fullRoute.length - 1)
      const alpha = frac - lo

      const [lng0, lat0] = fullRoute[lo]
      const [lng1, lat1] = fullRoute[hi]
      const tip: [number, number] = [lng0 + (lng1 - lng0) * alpha, lat0 + (lat1 - lat0) * alpha]

      // Route: all full points up to lo, plus the smooth interpolated tip
      const coords = [...fullRoute.slice(0, lo + 1), tip]
      routeSource.setData({
        type: 'Feature',
        properties: {},
        geometry: { type: 'LineString', coordinates: coords.length >= 2 ? coords : [...coords, tip] },
      })

      // Camera glides along with the tip
      map.jumpTo({
        center: tip,
        zoom: fromZoom + (toZoom - fromZoom) * eased,
        pitch: fromPitch + (toPitch - fromPitch) * eased,
        bearing: 0,
      })

      if (t < 1) {
        animFrameRef.current = requestAnimationFrame(step)
      } else {
        visibleEndRef.current = toIdx
        animFrameRef.current = null
      }
    }

    animFrameRef.current = requestAnimationFrame(step)
  }, [mapLoaded, activeIdx, stops, fullRoute, segEndIndices])

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
                <div
                  className={`w-3 h-3 rounded-full border-2 flex-shrink-0 transition-all duration-300 ${
                    i === activeIdx
                      ? 'bg-red-500 border-red-500 scale-110'
                      : 'bg-white border-stone-300'
                  }`}
                />
                {i < stops.length - 1 && (
                  <div className="flex-1 w-px bg-stone-200 mt-2 min-h-[280px]" />
                )}
              </div>

              <div
                className={`flex-1 pb-12 transition-opacity duration-400 ${
                  i === activeIdx ? 'opacity-100' : 'opacity-35'
                }`}
              >
                {stop.dates && (
                  <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-stone-400 mb-1 -mt-0.5">
                    {stop.dates}
                  </p>
                )}
                <h3 className="text-lg font-bold text-stone-900 mb-2 leading-tight tracking-tight">
                  {stop.name}
                </h3>
                {stop.description && (
                  <p className="text-md text-stone-500 leading-relaxed max-w-lg">
                    {stop.description}
                  </p>
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
  )
}
