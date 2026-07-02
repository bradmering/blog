'use client'

import { useRef, useEffect, useState, useMemo, useCallback } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { ItineraryStop } from '@/lib/posts'

// Data is stored [lng, lat] (Mapbox convention); Leaflet wants [lat, lng]
function ll([lng, lat]: [number, number]): [number, number] {
  return [lat, lng]
}

export default function ItineraryMap({ stops }: { stops: ItineraryStop[] }) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef       = useRef<L.Map | null>(null)
  const dotRefs      = useRef<L.CircleMarker[]>([])
  const haloRefs     = useRef<L.CircleMarker[]>([])
  const stopRefs     = useRef<(HTMLDivElement | null)[]>([])
  const [activeIdx, setActiveIdx]   = useState(0)
  const [mapLoaded, setMapLoaded]   = useState(false)
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)

  const openLightbox  = useCallback((src: string) => setLightboxSrc(src), [])
  const closeLightbox = useCallback(() => setLightboxSrc(null), [])

  useEffect(() => {
    if (!lightboxSrc) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeLightbox() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [lightboxSrc, closeLightbox])

  const fullRoute = useMemo<[number, number][]>(() => {
    const pts: [number, number][] = []
    stops.forEach((s) => {
      pts.push(s.coordinates as [number, number])
      if (s.routePoints) pts.push(...(s.routePoints as [number, number][]))
    })
    return pts
  }, [stops])

  useEffect(() => {
    if (mapRef.current || !mapContainer.current) return

    const container = mapContainer.current
    const latLngs   = fullRoute.map(ll)
    const bounds     = L.latLngBounds(latLngs)

    // Defer init until after paint so the container has its CSS dimensions
    const raf = requestAnimationFrame(() => {
      if (mapRef.current || !container) return

      const map = L.map(container, {
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

      map.fitBounds(bounds, { paddingTopLeft: [60, 80], paddingBottomRight: [60, 80] })

      // Route — glow underneath, line on top
      L.polyline(latLngs, { color: '#ef4444', weight: 8,  opacity: 0.18, interactive: false }).addTo(map)
      L.polyline(latLngs, { color: '#ef4444', weight: 2,  opacity: 0.9,  interactive: false }).addTo(map)

      // Stop markers
      const dots:  L.CircleMarker[] = []
      const halos: L.CircleMarker[] = []
      stops.forEach((stop, i) => {
        const coord  = ll(stop.coordinates as [number, number])
        const active = i === 0
        halos.push(L.circleMarker(coord, {
          radius: active ? 14 : 0,
          color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.2, weight: 0,
          interactive: false,
        }).addTo(map))
        dots.push(L.circleMarker(coord, {
          radius: active ? 7 : 4,
          color: '#ef4444', weight: 2,
          fillColor: active ? '#ef4444' : '#ffffff', fillOpacity: 1,
          interactive: false,
        }).addTo(map))
      })
      dotRefs.current  = dots
      haloRefs.current = halos
      mapRef.current   = map
      setMapLoaded(true)
    })

    return () => {
      cancelAnimationFrame(raf)
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current   = null
        dotRefs.current  = []
        haloRefs.current = []
      }
    }
  }, [stops, fullRoute])

  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return
    const stop = stops[activeIdx]

    dotRefs.current.forEach((dot, i) => {
      const active = i === activeIdx
      dot.setRadius(active ? 7 : 4)
      dot.setStyle({ fillColor: active ? '#ef4444' : '#ffffff' })
    })
    haloRefs.current.forEach((halo, i) => {
      halo.setRadius(i === activeIdx ? 14 : 0)
    })

    mapRef.current.flyTo(ll(stop.coordinates as [number, number]), stop.zoom ?? 10, {
      duration: 1.8,
      easeLinearity: 0.3,
    })
  }, [mapLoaded, activeIdx, stops])

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
            <div className="absolute bottom-5 left-5 bg-black/50 backdrop-blur-sm text-white text-xs font-medium px-3 py-1.5 rounded-full pointer-events-none z-[1000]">
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
