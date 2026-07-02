'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import type { ItineraryStop } from '@/lib/posts'

const STORIES = ['canning-river', 'great-wheel', 'hulahula']
const ITINERARY_POSTS = ['hulahula-plan']

type Coord = [number, number]
type Mode = 'route' | 'itinerary'

function updateLineSource(map: mapboxgl.Map, coords: Coord[]) {
  const src = map.getSource('route') as mapboxgl.GeoJSONSource | undefined
  src?.setData({
    type: 'Feature',
    properties: {},
    geometry: { type: 'LineString', coordinates: coords },
  })
}

function flattenStops(stops: ItineraryStop[]): Coord[] {
  const pts: Coord[] = []
  stops.forEach((s) => {
    pts.push(s.coordinates as Coord)
    if (s.routePoints) pts.push(...(s.routePoints as Coord[]))
  })
  return pts
}

function round6(n: number) {
  return Math.round(n * 1e6) / 1e6
}

export default function RouteEditor() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mode, setMode] = useState<Mode>('route')

  // ── Route mode ──────────────────────────────────────────────────────────────
  const markersRef = useRef<mapboxgl.Marker[]>([])
  const routeRef = useRef<Coord[]>([])
  const [story, setStory] = useState(STORIES[0])
  const [displayRoute, setDisplayRoute] = useState<Coord[]>([])
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  // ── Itinerary mode ──────────────────────────────────────────────────────────
  const [iPost, setIPost] = useState(ITINERARY_POSTS[0])
  const iStopsRef = useRef<ItineraryStop[]>([])
  const [iStops, setIStops] = useState<ItineraryStop[]>([])
  const [iActiveStop, setIActiveStop] = useState(0)
  const iActiveStopRef = useRef(0)
  const stopMarkersRef = useRef<mapboxgl.Marker[]>([])
  const wpMarkersRef = useRef<mapboxgl.Marker[]>([])
  const [iStatus, setIStatus] = useState<'idle' | 'saving' | 'saved'>('idle')

  // Keep ref in sync with state so stable callbacks can read current value
  useEffect(() => { iActiveStopRef.current = iActiveStop }, [iActiveStop])

  // ── Map init ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (mapRef.current || !mapContainer.current) return
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [-144, 69.5],
      zoom: 7,
    })
    map.addControl(new mapboxgl.NavigationControl(), 'top-left')
    map.on('load', () => {
      map.addSource('route', {
        type: 'geojson',
        data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [] } },
      })
      map.addLayer({ id: 'route-glow', type: 'line', source: 'route', paint: { 'line-color': '#dc2626', 'line-width': 8, 'line-opacity': 0.2, 'line-blur': 3 } })
      map.addLayer({ id: 'route-line', type: 'line', source: 'route', paint: { 'line-color': '#dc2626', 'line-width': 2.5, 'line-opacity': 0.9 } })
      setMapLoaded(true)
    })
    mapRef.current = map
    return () => { map.remove(); mapRef.current = null }
  }, [])

  // ── Route mode: build markers ───────────────────────────────────────────────
  const buildMarkers = useCallback((coords: Coord[]) => {
    const map = mapRef.current
    if (!map) return
    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []
    coords.forEach((coord, i) => {
      const el = document.createElement('div')
      el.style.cssText = 'cursor:grab;'
      const isFirst = i === 0, isLast = i === coords.length - 1
      const size = isFirst || isLast ? 12 : 8
      const dot = document.createElement('div')
      dot.style.cssText = [
        `width:${size}px`, `height:${size}px`, 'border-radius:50%',
        `background:${isFirst ? '#22c55e' : isLast ? '#f97316' : '#dc2626'}`,
        'border:2px solid white', 'box-shadow:0 1px 4px rgba(0,0,0,0.5)',
        'transition:transform 0.1s', 'pointer-events:none',
      ].join(';')
      el.appendChild(dot)
      el.title = `Point ${i}: [${coord[0]}, ${coord[1]}]\nDouble-click to delete`
      el.addEventListener('mouseenter', () => { dot.style.transform = 'scale(1.6)'; setHoveredIdx(i) })
      el.addEventListener('mouseleave', () => { dot.style.transform = 'scale(1)'; setHoveredIdx(null) })
      const marker = new mapboxgl.Marker({ element: el, draggable: true }).setLngLat(coord).addTo(map)
      marker.on('drag', () => {
        const ll = marker.getLngLat()
        const updated = [...routeRef.current]
        updated[i] = [round6(ll.lng), round6(ll.lat)]
        routeRef.current = updated
        updateLineSource(map, updated)
      })
      marker.on('dragend', () => setDisplayRoute([...routeRef.current]))
      el.addEventListener('dblclick', (e) => {
        e.stopPropagation()
        const updated = routeRef.current.filter((_, j) => j !== i)
        routeRef.current = updated
        buildMarkers(updated)
        updateLineSource(map, updated)
        setDisplayRoute([...updated])
      })
      markersRef.current.push(marker)
    })
  }, [])

  // ── Itinerary mode: build all stop + waypoint markers ───────────────────────
  const buildItineraryMarkers = useCallback((stops: ItineraryStop[], activeIdx: number) => {
    const map = mapRef.current
    if (!map) return
    stopMarkersRef.current.forEach((m) => m.remove())
    wpMarkersRef.current.forEach((m) => m.remove())
    stopMarkersRef.current = []
    wpMarkersRef.current = []

    // Stop markers — large numbered, draggable
    stops.forEach((stop, si) => {
      const isActive = si === activeIdx
      const el = document.createElement('div')
      el.style.cssText = 'cursor:grab;'
      const pin = document.createElement('div')
      pin.style.cssText = [
        'width:26px', 'height:26px', 'border-radius:50%',
        `background:${isActive ? '#dc2626' : '#1e293b'}`,
        'border:2px solid white', 'box-shadow:0 2px 6px rgba(0,0,0,0.6)',
        'display:flex', 'align-items:center', 'justify-content:center',
        'font-size:10px', 'font-weight:700', 'color:white',
        'transition:background 0.2s', 'pointer-events:none',
      ].join(';')
      pin.textContent = String(si + 1)
      el.appendChild(pin)
      el.title = `${stop.name} — drag to move\n[${stop.coordinates[0]}, ${stop.coordinates[1]}]`

      const marker = new mapboxgl.Marker({ element: el, draggable: true })
        .setLngLat(stop.coordinates as Coord)
        .addTo(map)

      marker.on('drag', () => {
        const ll = marker.getLngLat()
        const updated = [...iStopsRef.current]
        updated[si] = { ...updated[si], coordinates: [round6(ll.lng), round6(ll.lat)] }
        iStopsRef.current = updated
        updateLineSource(map, flattenStops(updated))
      })
      marker.on('dragend', () => setIStops([...iStopsRef.current]))

      // Click to activate this segment
      el.addEventListener('click', (e) => {
        e.stopPropagation()
        setIActiveStop(si)
      })

      stopMarkersRef.current.push(marker)
    })

    // Waypoint markers — small dots, draggable, dblclick to delete
    stops.forEach((stop, si) => {
      const isActiveSegment = si === activeIdx
      ;(stop.routePoints ?? []).forEach((pt, pi) => {
        const el = document.createElement('div')
        el.style.cssText = 'cursor:grab;'
        const dot = document.createElement('div')
        dot.style.cssText = [
          'width:8px', 'height:8px', 'border-radius:50%',
          `background:${isActiveSegment ? '#ef4444' : '#64748b'}`,
          'border:1.5px solid white', 'box-shadow:0 1px 3px rgba(0,0,0,0.4)',
          'transition:transform 0.1s', 'pointer-events:none',
        ].join(';')
        el.appendChild(dot)
        el.title = `Waypoint after stop ${si + 1}, index ${pi}\n[${pt[0]}, ${pt[1]}]\nDrag to move · Dbl-click to delete`
        el.addEventListener('mouseenter', () => { dot.style.transform = 'scale(2)' })
        el.addEventListener('mouseleave', () => { dot.style.transform = 'scale(1)' })

        const marker = new mapboxgl.Marker({ element: el, draggable: true })
          .setLngLat(pt as Coord)
          .addTo(map)

        marker.on('drag', () => {
          const ll = marker.getLngLat()
          const updated = [...iStopsRef.current]
          const rps = [...(updated[si].routePoints ?? [])] as Coord[]
          rps[pi] = [round6(ll.lng), round6(ll.lat)]
          updated[si] = { ...updated[si], routePoints: rps }
          iStopsRef.current = updated
          updateLineSource(map, flattenStops(updated))
        })
        marker.on('dragend', () => setIStops([...iStopsRef.current]))

        el.addEventListener('dblclick', (e) => {
          e.stopPropagation()
          const updated = [...iStopsRef.current]
          const rps = (updated[si].routePoints ?? []).filter((_, j) => j !== pi) as Coord[]
          updated[si] = { ...updated[si], routePoints: rps }
          iStopsRef.current = updated
          buildItineraryMarkers(updated, iActiveStopRef.current)
          updateLineSource(map, flattenStops(updated))
          setIStops([...updated])
        })

        wpMarkersRef.current.push(marker)
      })
    })
  }, [])

  // ── Route mode: load story ──────────────────────────────────────────────────
  useEffect(() => {
    if (!mapLoaded || mode !== 'route') return
    fetch(`/api/dev/story-route?story=${story}`)
      .then((r) => r.json())
      .then((data: { route: Coord[] }) => {
        routeRef.current = data.route
        setDisplayRoute(data.route)
        buildMarkers(data.route)
        updateLineSource(mapRef.current!, data.route)
        if (data.route.length > 0) {
          const lngs = data.route.map((p) => p[0])
          const lats = data.route.map((p) => p[1])
          mapRef.current!.fitBounds(
            [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
            { padding: 60, duration: 800 }
          )
        }
      })
  }, [story, mapLoaded, mode, buildMarkers])

  // ── Itinerary mode: load post ───────────────────────────────────────────────
  useEffect(() => {
    if (!mapLoaded || mode !== 'itinerary') return
    fetch(`/api/dev/itinerary?post=${iPost}`)
      .then((r) => r.json())
      .then((data: { stops: ItineraryStop[] }) => {
        iStopsRef.current = data.stops
        setIStops(data.stops)
        setIActiveStop(0)
        buildItineraryMarkers(data.stops, 0)
        updateLineSource(mapRef.current!, flattenStops(data.stops))
        const all = flattenStops(data.stops)
        if (all.length > 0) {
          const lngs = all.map((p) => p[0])
          const lats = all.map((p) => p[1])
          mapRef.current!.fitBounds(
            [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
            { padding: 80, duration: 800 }
          )
        }
      })
  }, [iPost, mapLoaded, mode, buildItineraryMarkers])

  // ── Rebuild itinerary markers when active stop changes ──────────────────────
  useEffect(() => {
    if (mode !== 'itinerary' || !mapLoaded || iStopsRef.current.length === 0) return
    buildItineraryMarkers(iStopsRef.current, iActiveStop)
  }, [iActiveStop, mode, mapLoaded, buildItineraryMarkers])

  // ── Clear markers when switching modes ──────────────────────────────────────
  useEffect(() => {
    if (mode === 'route') {
      stopMarkersRef.current.forEach((m) => m.remove())
      wpMarkersRef.current.forEach((m) => m.remove())
      stopMarkersRef.current = []
      wpMarkersRef.current = []
    } else {
      markersRef.current.forEach((m) => m.remove())
      markersRef.current = []
    }
  }, [mode])

  // ── Route click: insert into nearest segment ────────────────────────────────
  const handleRouteClick = useCallback((e: mapboxgl.MapMouseEvent) => {
    if ((e.originalEvent.target as HTMLElement).closest('.mapboxgl-marker')) return
    const route = routeRef.current
    if (route.length < 2) return
    const cx = e.lngLat.lng, cy = e.lngLat.lat
    let bestIdx = 0, bestDist = Infinity
    for (let i = 0; i < route.length - 1; i++) {
      const mx = (route[i][0] + route[i + 1][0]) / 2
      const my = (route[i][1] + route[i + 1][1]) / 2
      const d = Math.hypot(cx - mx, cy - my)
      if (d < bestDist) { bestDist = d; bestIdx = i }
    }
    const updated = [
      ...route.slice(0, bestIdx + 1),
      [round6(cx), round6(cy)] as Coord,
      ...route.slice(bestIdx + 1),
    ]
    routeRef.current = updated
    buildMarkers(updated)
    updateLineSource(mapRef.current!, updated)
    setDisplayRoute([...updated])
  }, [buildMarkers])

  // ── Itinerary click: insert waypoint into active segment ────────────────────
  const handleItineraryClick = useCallback((e: mapboxgl.MapMouseEvent) => {
    if ((e.originalEvent.target as HTMLElement).closest('.mapboxgl-marker')) return
    const stops = iStopsRef.current
    if (stops.length === 0) return
    const cx = round6(e.lngLat.lng), cy = round6(e.lngLat.lat)
    const activeIdx = iActiveStopRef.current
    const activeStop = stops[activeIdx]
    const wps = (activeStop.routePoints ?? []) as Coord[]
    const segStart = activeStop.coordinates as Coord
    const segEnd = activeIdx + 1 < stops.length ? stops[activeIdx + 1].coordinates as Coord : null
    const allPts: Coord[] = [segStart, ...wps, ...(segEnd ? [segEnd] : [])]

    // Find which gap the click is nearest to
    let bestIdx = wps.length, bestDist = Infinity
    for (let i = 0; i < allPts.length - 1; i++) {
      const mx = (allPts[i][0] + allPts[i + 1][0]) / 2
      const my = (allPts[i][1] + allPts[i + 1][1]) / 2
      const d = Math.hypot(cx - mx, cy - my)
      if (d < bestDist) { bestDist = d; bestIdx = i }
    }

    // bestIdx is the index into allPts; insert after allPts[bestIdx] = insert at wps[bestIdx]
    const newWps: Coord[] = [...wps.slice(0, bestIdx), [cx, cy], ...wps.slice(bestIdx)]
    const updated = [...stops]
    updated[activeIdx] = { ...activeStop, routePoints: newWps }
    iStopsRef.current = updated
    buildItineraryMarkers(updated, activeIdx)
    updateLineSource(mapRef.current!, flattenStops(updated))
    setIStops([...updated])
  }, [buildItineraryMarkers])

  // ── Wire click handler based on mode ────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapLoaded) return
    const handler = mode === 'route' ? handleRouteClick : handleItineraryClick
    map.on('click', handler)
    return () => { map.off('click', handler) }
  }, [mapLoaded, mode, handleRouteClick, handleItineraryClick])

  // ── Route mode actions ──────────────────────────────────────────────────────
  const save = async () => {
    setStatus('saving')
    await fetch('/api/dev/story-route', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ story, route: routeRef.current }),
    })
    setStatus('saved')
    setTimeout(() => setStatus('idle'), 2000)
  }

  const copyYaml = () => {
    const yaml = 'route:\n' + routeRef.current.map((p) => `  - [${p[0]}, ${p[1]}]`).join('\n')
    navigator.clipboard.writeText(yaml)
  }

  const undo = () => {
    if (routeRef.current.length < 2) return
    const updated = routeRef.current.slice(0, -1)
    routeRef.current = updated
    buildMarkers(updated)
    updateLineSource(mapRef.current!, updated)
    setDisplayRoute([...updated])
  }

  // ── Itinerary mode actions ──────────────────────────────────────────────────
  const saveItinerary = async () => {
    setIStatus('saving')
    await fetch('/api/dev/itinerary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post: iPost, stops: iStopsRef.current }),
    })
    setIStatus('saved')
    setTimeout(() => setIStatus('idle'), 2000)
  }

  const copyItineraryYaml = () => {
    const lines = iStopsRef.current.map((s) => {
      let out = `  - id: ${s.id}\n    coordinates: [${s.coordinates[0]}, ${s.coordinates[1]}]`
      if (s.routePoints?.length) {
        out += '\n    routePoints:\n' + s.routePoints.map((p) => `      - [${p[0]}, ${p[1]}]`).join('\n')
      }
      return out
    }).join('\n')
    navigator.clipboard.writeText('itinerary:\n' + lines)
  }

  const activeWps = (iStops[iActiveStop]?.routePoints ?? []) as Coord[]

  return (
    <div className="fixed inset-0 z-50 flex bg-black">
      {/* Map */}
      <div ref={mapContainer} className="flex-1" />

      {/* Sidebar */}
      <div className="w-80 flex flex-col bg-neutral-900 text-white text-sm overflow-hidden border-l border-neutral-700">

        {/* Mode toggle */}
        <div className="flex border-b border-neutral-700 shrink-0">
          {(['route', 'itinerary'] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-[0.15em] transition-colors ${
                mode === m
                  ? 'bg-neutral-800 text-white border-b-2 border-red-500'
                  : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        {/* ── Route mode ── */}
        {mode === 'route' && (
          <>
            <div className="p-4 border-b border-neutral-700 space-y-3 shrink-0">
              <select
                value={story}
                onChange={(e) => setStory(e.target.value)}
                className="w-full bg-neutral-800 border border-neutral-600 rounded px-3 py-1.5 text-white text-sm"
              >
                {STORIES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <div className="text-xs text-neutral-400">
                {displayRoute.length} points &nbsp;·&nbsp;
                <span className="text-green-400">● start</span>&nbsp;&nbsp;
                <span className="text-orange-400">● end</span>&nbsp;&nbsp;
                <span className="text-red-400">● waypoint</span>
              </div>
              <div className="text-xs text-neutral-500 leading-relaxed">
                <strong className="text-neutral-300">Drag</strong> to move &nbsp;·&nbsp;
                <strong className="text-neutral-300">Click map</strong> to insert &nbsp;·&nbsp;
                <strong className="text-neutral-300">Dbl-click</strong> to delete
              </div>
            </div>
            <div className="flex-1 overflow-y-auto font-mono">
              {displayRoute.map((p, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-2 px-3 py-1 text-xs border-b border-neutral-800 transition-colors ${
                    hoveredIdx === i ? 'bg-neutral-700 text-white' : 'text-neutral-300 hover:bg-neutral-800'
                  }`}
                >
                  <span className="text-neutral-500 w-7 text-right shrink-0">{i}</span>
                  <span className={i === 0 ? 'text-green-400' : i === displayRoute.length - 1 ? 'text-orange-400' : 'text-neutral-300'}>
                    [{p[0]}, {p[1]}]
                  </span>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-neutral-700 flex flex-col gap-2 shrink-0">
              <button onClick={copyYaml} className="w-full bg-neutral-700 hover:bg-neutral-600 text-xs font-medium py-2 rounded transition-colors">Copy YAML</button>
              <button onClick={undo} className="w-full bg-neutral-700 hover:bg-neutral-600 text-xs font-medium py-2 rounded transition-colors">Remove Last Point</button>
              <button
                onClick={save}
                disabled={status === 'saving'}
                className={`w-full text-xs font-bold py-2 rounded transition-colors ${
                  status === 'saved' ? 'bg-green-600' : status === 'saving' ? 'bg-neutral-600 cursor-not-allowed' : 'bg-red-600 hover:bg-red-500'
                }`}
              >
                {status === 'saving' ? 'Saving…' : status === 'saved' ? '✓ Saved to YAML' : 'Save to YAML'}
              </button>
            </div>
          </>
        )}

        {/* ── Itinerary mode ── */}
        {mode === 'itinerary' && (
          <>
            <div className="p-4 border-b border-neutral-700 space-y-3 shrink-0">
              <select
                value={iPost}
                onChange={(e) => setIPost(e.target.value)}
                className="w-full bg-neutral-800 border border-neutral-600 rounded px-3 py-1.5 text-white text-sm"
              >
                {ITINERARY_POSTS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
              <div className="text-xs text-neutral-500 leading-relaxed">
                <strong className="text-neutral-300">Click stop</strong> to select segment &nbsp;·&nbsp;
                <strong className="text-neutral-300">Drag</strong> any marker &nbsp;·&nbsp;
                <strong className="text-neutral-300">Click map</strong> to add waypoint &nbsp;·&nbsp;
                <strong className="text-neutral-300">Dbl-click</strong> waypoint to delete
              </div>
            </div>

            {/* Stop list */}
            <div className="border-b border-neutral-700 shrink-0">
              {iStops.map((stop, i) => (
                <button
                  key={stop.id}
                  onClick={() => setIActiveStop(i)}
                  className={`w-full text-left flex items-center gap-3 px-4 py-2.5 border-b border-neutral-800 last:border-0 transition-colors ${
                    i === iActiveStop
                      ? 'bg-red-950/50 text-white'
                      : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[9px] font-bold border ${
                    i === iActiveStop
                      ? 'bg-red-600 border-red-400 text-white'
                      : 'bg-neutral-700 border-neutral-600 text-neutral-300'
                  }`}>
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium truncate">{stop.name}</div>
                    <div className="text-[10px] font-mono text-neutral-500">
                      {stop.coordinates[0]}, {stop.coordinates[1]}
                    </div>
                  </div>
                  <span className="text-[10px] text-neutral-600 shrink-0">
                    {stop.routePoints?.length ?? 0}wp
                  </span>
                </button>
              ))}
            </div>

            {/* Active segment waypoints */}
            <div className="flex-1 overflow-y-auto">
              {iStops[iActiveStop] && (
                <div className="p-3">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-red-400 mb-2">
                    Waypoints → stop {iActiveStop + 2 <= iStops.length ? iActiveStop + 2 : '(end)'}
                  </div>
                  {activeWps.length === 0 ? (
                    <p className="text-[11px] text-neutral-600 italic">
                      Click the map to add waypoints between stop {iActiveStop + 1} and the next.
                    </p>
                  ) : (
                    <div className="font-mono space-y-0.5">
                      {activeWps.map((pt, pi) => (
                        <div key={pi} className="flex items-center gap-2 text-xs text-neutral-400 py-0.5">
                          <span className="text-neutral-600 w-4 text-right shrink-0">{pi}</span>
                          <span>[{pt[0]}, {pt[1]}]</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-neutral-700 flex flex-col gap-2 shrink-0">
              <button onClick={copyItineraryYaml} className="w-full bg-neutral-700 hover:bg-neutral-600 text-xs font-medium py-2 rounded transition-colors">
                Copy Coords YAML
              </button>
              <button
                onClick={saveItinerary}
                disabled={iStatus === 'saving'}
                className={`w-full text-xs font-bold py-2 rounded transition-colors ${
                  iStatus === 'saved' ? 'bg-green-600' : iStatus === 'saving' ? 'bg-neutral-600 cursor-not-allowed' : 'bg-red-600 hover:bg-red-500'
                }`}
              >
                {iStatus === 'saving' ? 'Saving…' : iStatus === 'saved' ? '✓ Saved to Markdown' : 'Save to Markdown'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
