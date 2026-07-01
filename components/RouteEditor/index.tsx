'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

const STORIES = ['canning-river', 'great-wheel', 'hulahula']

type Coord = [number, number]

function updateLineSource(map: mapboxgl.Map, coords: Coord[]) {
  const src = map.getSource('route') as mapboxgl.GeoJSONSource | undefined
  src?.setData({
    type: 'Feature',
    properties: {},
    geometry: { type: 'LineString', coordinates: coords },
  })
}

export default function RouteEditor() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<mapboxgl.Marker[]>([])
  const routeRef = useRef<Coord[]>([])
  const [mapLoaded, setMapLoaded] = useState(false)
  const [story, setStory] = useState(STORIES[0])
  const [displayRoute, setDisplayRoute] = useState<Coord[]>([])
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  // Init map once
  useEffect(() => {
    if (mapRef.current || !mapContainer.current) return

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [-146, 69],
      zoom: 7,
    })

    map.addControl(new mapboxgl.NavigationControl(), 'top-left')

    map.on('load', () => {
      map.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: { type: 'LineString', coordinates: [] },
        },
      })
      map.addLayer({
        id: 'route-glow',
        type: 'line',
        source: 'route',
        paint: { 'line-color': '#dc2626', 'line-width': 8, 'line-opacity': 0.2, 'line-blur': 3 },
      })
      map.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route',
        paint: { 'line-color': '#dc2626', 'line-width': 2.5, 'line-opacity': 0.9 },
      })
      setMapLoaded(true)
    })

    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  const buildMarkers = useCallback(
    (coords: Coord[]) => {
      const map = mapRef.current
      if (!map) return

      markersRef.current.forEach((m) => m.remove())
      markersRef.current = []

      coords.forEach((coord, i) => {
        // Mapbox sets transform:translate(...) on the root element to position the marker.
        // Applying transform to `el` would override that and send the marker to (0,0).
        // Use a child `dot` element for all visual styling and hover effects instead.
        const el = document.createElement('div')
        el.style.cssText = 'cursor:grab;'

        const isFirst = i === 0
        const isLast = i === coords.length - 1
        const size = isFirst || isLast ? 12 : 8
        const dot = document.createElement('div')
        dot.style.cssText = [
          `width:${size}px`,
          `height:${size}px`,
          'border-radius:50%',
          `background:${isFirst ? '#22c55e' : isLast ? '#f97316' : '#dc2626'}`,
          'border:2px solid white',
          'box-shadow:0 1px 4px rgba(0,0,0,0.5)',
          'transition:transform 0.1s',
          'pointer-events:none',
        ].join(';')
        el.appendChild(dot)

        el.title = `Point ${i}: [${coord[0]}, ${coord[1]}]\nDouble-click to delete`

        el.addEventListener('mouseenter', () => {
          dot.style.transform = 'scale(1.6)'
          setHoveredIdx(i)
        })
        el.addEventListener('mouseleave', () => {
          dot.style.transform = 'scale(1)'
          setHoveredIdx(null)
        })

        const marker = new mapboxgl.Marker({ element: el, draggable: true })
          .setLngLat(coord)
          .addTo(map)

        marker.on('drag', () => {
          const ll = marker.getLngLat()
          const updated = [...routeRef.current]
          updated[i] = [
            Math.round(ll.lng * 1e6) / 1e6,
            Math.round(ll.lat * 1e6) / 1e6,
          ]
          routeRef.current = updated
          updateLineSource(map, updated)
        })

        marker.on('dragend', () => {
          setDisplayRoute([...routeRef.current])
        })

        // Double-click to delete
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
    },
    []
  )

  // Load route when story or map changes
  useEffect(() => {
    if (!mapLoaded) return

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
  }, [story, mapLoaded, buildMarkers])

  // Click on map to insert a point between nearest segment
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapLoaded) return

    const onClick = (e: mapboxgl.MapMouseEvent) => {
      if ((e.originalEvent.target as HTMLElement).closest('.mapboxgl-marker')) return

      const clickedLng = e.lngLat.lng
      const clickedLat = e.lngLat.lat
      const route = routeRef.current
      if (route.length < 2) return

      // Find nearest segment
      let bestIdx = 0
      let bestDist = Infinity
      for (let i = 0; i < route.length - 1; i++) {
        const mx = (route[i][0] + route[i + 1][0]) / 2
        const my = (route[i][1] + route[i + 1][1]) / 2
        const d = Math.hypot(clickedLng - mx, clickedLat - my)
        if (d < bestDist) { bestDist = d; bestIdx = i }
      }

      const updated = [
        ...route.slice(0, bestIdx + 1),
        [Math.round(clickedLng * 1e6) / 1e6, Math.round(clickedLat * 1e6) / 1e6] as Coord,
        ...route.slice(bestIdx + 1),
      ]
      routeRef.current = updated
      buildMarkers(updated)
      updateLineSource(map, updated)
      setDisplayRoute([...updated])
    }

    map.on('click', onClick)
    return () => { map.off('click', onClick) }
  }, [mapLoaded, buildMarkers])

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
    const yaml =
      'route:\n' + routeRef.current.map((p) => `  - [${p[0]}, ${p[1]}]`).join('\n')
    navigator.clipboard.writeText(yaml)
  }

  const undo = () => {
    // Remove last added point (simple undo)
    if (routeRef.current.length < 2) return
    const updated = routeRef.current.slice(0, -1)
    routeRef.current = updated
    buildMarkers(updated)
    updateLineSource(mapRef.current!, updated)
    setDisplayRoute([...updated])
  }

  return (
    <div className="fixed inset-0 z-50 flex bg-black">
      {/* Map */}
      <div ref={mapContainer} className="flex-1" />

      {/* Sidebar */}
      <div className="w-80 flex flex-col bg-neutral-900 text-white text-sm overflow-hidden border-l border-neutral-700">
        {/* Header */}
        <div className="p-4 border-b border-neutral-700 space-y-3">
          <div className="text-xs font-bold uppercase tracking-widest text-neutral-400">
            Route Editor
          </div>
          <select
            value={story}
            onChange={(e) => setStory(e.target.value)}
            className="w-full bg-neutral-800 border border-neutral-600 rounded px-3 py-1.5 text-white text-sm"
          >
            {STORIES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <div className="text-xs text-neutral-400">
            {displayRoute.length} points &nbsp;·&nbsp;
            <span className="text-green-400">● start</span>
            &nbsp;&nbsp;
            <span className="text-orange-400">● end</span>
            &nbsp;&nbsp;
            <span className="text-red-400">● waypoint</span>
          </div>
          <div className="text-xs text-neutral-500 leading-relaxed">
            <strong className="text-neutral-300">Drag</strong> markers to move &nbsp;·&nbsp;
            <strong className="text-neutral-300">Click map</strong> to insert &nbsp;·&nbsp;
            <strong className="text-neutral-300">Dbl-click</strong> marker to delete
          </div>
        </div>

        {/* Coordinate list */}
        <div className="flex-1 overflow-y-auto font-mono">
          {displayRoute.map((p, i) => (
            <div
              key={i}
              className={`flex items-center gap-2 px-3 py-1 text-xs border-b border-neutral-800 transition-colors ${
                hoveredIdx === i ? 'bg-neutral-700 text-white' : 'text-neutral-300 hover:bg-neutral-800'
              }`}
            >
              <span className="text-neutral-500 w-7 text-right shrink-0">{i}</span>
              <span className={
                i === 0 ? 'text-green-400' :
                i === displayRoute.length - 1 ? 'text-orange-400' :
                'text-neutral-300'
              }>
                [{p[0]}, {p[1]}]
              </span>
            </div>
          ))}
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-neutral-700 flex flex-col gap-2">
          <button
            onClick={copyYaml}
            className="w-full bg-neutral-700 hover:bg-neutral-600 text-white text-xs font-medium py-2 rounded transition-colors"
          >
            Copy YAML
          </button>
          <button
            onClick={undo}
            className="w-full bg-neutral-700 hover:bg-neutral-600 text-white text-xs font-medium py-2 rounded transition-colors"
          >
            Remove Last Point
          </button>
          <button
            onClick={save}
            disabled={status === 'saving'}
            className={`w-full text-white text-xs font-bold py-2 rounded transition-colors ${
              status === 'saved'
                ? 'bg-green-600'
                : status === 'saving'
                ? 'bg-neutral-600 cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-500'
            }`}
          >
            {status === 'saving' ? 'Saving…' : status === 'saved' ? '✓ Saved to YAML' : 'Save to YAML'}
          </button>
        </div>
      </div>
    </div>
  )
}
