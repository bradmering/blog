'use client'

import { useRef, useEffect, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import type { ItineraryStop } from '@/lib/posts'

export default function ItineraryMap({ stops }: { stops: ItineraryStop[] }) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const stopRefs = useRef<(HTMLDivElement | null)[]>([])
  const markerEls = useRef<HTMLDivElement[]>([])
  const [activeIdx, setActiveIdx] = useState(0)
  const [mapLoaded, setMapLoaded] = useState(false)

  useEffect(() => {
    if (mapRef.current || !mapContainer.current) return

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

    const coords = stops.map((s) => s.coordinates as [number, number])
    const bounds = coords.reduce(
      (b, c) => b.extend(c),
      new mapboxgl.LngLatBounds(coords[0], coords[0])
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
      map.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: { type: 'LineString', coordinates: coords },
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

      markerEls.current = stops.map((stop, i) => {
        const el = document.createElement('div')
        el.style.cssText =
          'width:10px;height:10px;border-radius:50%;background:white;border:2px solid #ef4444;box-shadow:0 1px 4px rgba(0,0,0,0.35);transition:transform 0.25s,background 0.25s;'
        new mapboxgl.Marker({ element: el, anchor: 'center' })
          .setLngLat(stop.coordinates as [number, number])
          .addTo(map)
        return el
      })

      setMapLoaded(true)
    })

    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [stops])

  // Fly to active stop
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return
    const stop = stops[activeIdx]
    mapRef.current.flyTo({
      center: stop.coordinates as [number, number],
      zoom: stop.zoom ?? 10,
      pitch: stop.pitch ?? 30,
      bearing: 0,
      duration: 2400,
      essential: true,
    })
  }, [mapLoaded, activeIdx, stops])

  // Update marker styles on active change
  useEffect(() => {
    markerEls.current.forEach((el, i) => {
      if (i === activeIdx) {
        el.style.background = '#ef4444'
        el.style.transform = 'scale(1.6)'
        el.style.zIndex = '10'
      } else {
        el.style.background = 'white'
        el.style.transform = 'scale(1)'
        el.style.zIndex = '1'
      }
    })
  }, [activeIdx])

  // Intersection observer to drive active stop
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
      {/* ── Timeline (left on desktop, bottom on mobile) ── */}
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
              {/* Dot + connector */}
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

              {/* Content */}
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

      {/* ── Map (right on desktop, top on mobile) ── */}
      <div className="order-1 lg:order-2 lg:w-[48%] h-[40vh] lg:h-auto">
        <div className="sticky top-14 h-[40vh] lg:h-[calc(100vh-3.5rem)]">
          <div ref={mapContainer} className="w-full h-full" />
          {/* Stop counter */}
          <div className="absolute bottom-5 left-5 bg-black/50 backdrop-blur-sm text-white text-xs font-medium px-3 py-1.5 rounded-full pointer-events-none">
            {activeIdx + 1} / {stops.length}
          </div>
        </div>
      </div>
    </section>
  )
}
