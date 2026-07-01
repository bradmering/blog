'use client'

import { useRef, useState, useCallback, useEffect, ChangeEvent } from 'react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Command { redo(): void; undo(): void }

type LineMode = 'route' | 'ledge' | 'crack' | 'roof' | 'rock'
type PointMode = 'belay' | 'annotation'
type DrawMode = LineMode | PointMode

interface FeatureContent {
  title: string; grade: string; description: string
  imageDataUrl?: string; imageName?: string
}

interface RouteFeature      { id: string; type: 'route';      points: [number, number][]; label: string; content: FeatureContent }
interface TopoLineFeature   { id: string; type: 'topo-line';  style: Exclude<LineMode,'route'|'rock'>; points: [number, number][] }
interface RockFeature       { id: string; type: 'rock';       points: [number, number][] }
interface BelayFeature      { id: string; type: 'belay';      position: [number, number]; pitch: number; content: FeatureContent }
interface AnnotationFeature { id: string; type: 'annotation'; position: [number, number]; label: string; content: FeatureContent }

type TopoFeature = RouteFeature | TopoLineFeature | RockFeature | BelayFeature | AnnotationFeature

// ─── Grade data ──────────────────────────────────────────────────────────────

const YDS_GROUPS: [string, string[]][] = [
  ['5.0 – 5.9', ['5.0','5.1','5.2','5.3','5.4','5.5','5.6','5.7','5.8','5.9']],
  ['5.10',      ['5.10a','5.10b','5.10c','5.10d']],
  ['5.11',      ['5.11a','5.11b','5.11c','5.11d']],
  ['5.12',      ['5.12a','5.12b','5.12c','5.12d']],
  ['5.13',      ['5.13a','5.13b','5.13c','5.13d']],
  ['5.14',      ['5.14a','5.14b','5.14c','5.14d']],
  ['5.15',      ['5.15a','5.15b','5.15c','5.15d']],
]

interface GradeConv { french: string; uiaa: string; uk: string; aus: string }

const CONVERSIONS: Record<string, GradeConv> = {
  '5.0':  { french: '1',   uiaa: 'I',     uk: 'M',       aus: '1'  },
  '5.1':  { french: '2',   uiaa: 'II',    uk: 'D',       aus: '2'  },
  '5.2':  { french: '2+',  uiaa: 'III',   uk: 'VD',      aus: '3'  },
  '5.3':  { french: '3',   uiaa: 'III+',  uk: 'VD/MS',   aus: '4'  },
  '5.4':  { french: '3+',  uiaa: 'IV',    uk: 'MS',      aus: '5'  },
  '5.5':  { french: '4a',  uiaa: 'IV+',   uk: 'HS',      aus: '6'  },
  '5.6':  { french: '4b',  uiaa: 'V-',    uk: 'HS/4a',   aus: '7'  },
  '5.7':  { french: '4c',  uiaa: 'V',     uk: 'S/4a',    aus: '8'  },
  '5.8':  { french: '5a',  uiaa: 'V+',    uk: 'HVS/4b',  aus: '9'  },
  '5.9':  { french: '5b',  uiaa: 'VI-',   uk: 'HVS/4c',  aus: '10' },
  '5.10a':{ french: '5c',  uiaa: 'VI',    uk: 'E1/5a',   aus: '11' },
  '5.10b':{ french: '6a',  uiaa: 'VI+',   uk: 'E1/5b',   aus: '12' },
  '5.10c':{ french: '6a+', uiaa: 'VII-',  uk: 'E2/5b',   aus: '13' },
  '5.10d':{ french: '6b',  uiaa: 'VII',   uk: 'E3/5c',   aus: '14' },
  '5.11a':{ french: '6b+', uiaa: 'VII+',  uk: 'E3/5c',   aus: '15' },
  '5.11b':{ french: '6c',  uiaa: 'VII+',  uk: 'E4/6a',   aus: '16' },
  '5.11c':{ french: '6c+', uiaa: 'VIII-', uk: 'E4/6a',   aus: '17' },
  '5.11d':{ french: '7a',  uiaa: 'VIII',  uk: 'E5/6b',   aus: '18' },
  '5.12a':{ french: '7a+', uiaa: 'VIII+', uk: 'E5/6b',   aus: '19' },
  '5.12b':{ french: '7b',  uiaa: 'VIII+', uk: 'E6/6b',   aus: '20' },
  '5.12c':{ french: '7b+', uiaa: 'IX-',   uk: 'E6/6c',   aus: '21' },
  '5.12d':{ french: '7c',  uiaa: 'IX',    uk: 'E7/7a',   aus: '22' },
  '5.13a':{ french: '7c+', uiaa: 'IX+',   uk: 'E7/7a',   aus: '23' },
  '5.13b':{ french: '8a',  uiaa: 'X-',    uk: 'E8/7b',   aus: '24' },
  '5.13c':{ french: '8a+', uiaa: 'X',     uk: 'E8/7b',   aus: '25' },
  '5.13d':{ french: '8b',  uiaa: 'X+',    uk: 'E9/7c',   aus: '26' },
  '5.14a':{ french: '8b+', uiaa: 'XI-',   uk: 'E10/8a',  aus: '27' },
  '5.14b':{ french: '8c',  uiaa: 'XI',    uk: 'E10/8b',  aus: '28' },
  '5.14c':{ french: '8c+', uiaa: 'XI+',   uk: 'E11/8c',  aus: '29' },
  '5.14d':{ french: '9a',  uiaa: 'XII',   uk: 'E11/8c+', aus: '30' },
  '5.15a':{ french: '9a+', uiaa: 'XII',   uk: '—',       aus: '—'  },
  '5.15b':{ french: '9b',  uiaa: 'XII+',  uk: '—',       aus: '—'  },
  '5.15c':{ french: '9b+', uiaa: 'XII+',  uk: '—',       aus: '—'  },
  '5.15d':{ french: '9c',  uiaa: 'XIII',  uk: '—',       aus: '—'  },
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function latlngToImage(lat: number, lng: number): [number, number] {
  return [Math.round(lng), Math.round(-lat)]
}

const LINE_MODES: DrawMode[] = ['route', 'ledge', 'crack', 'roof', 'rock']
function isLineMode(m: DrawMode): m is LineMode { return LINE_MODES.includes(m) }

function lineStyle(mode: LineMode) {
  switch (mode) {
    case 'route': return { color: '#dc2626', weight: 3,   opacity: 0.95 }
    case 'ledge': return { color: '#475569', weight: 6,   opacity: 0.9,  dashArray: '1 5' }
    case 'crack': return { color: '#57534e', weight: 2,   opacity: 0.9,  dashArray: '5 3' }
    case 'roof':  return { color: '#2563eb', weight: 4,   opacity: 0.9,  dashArray: '2 8' }
    case 'rock':  return { color: '#292524', weight: 2.5, opacity: 0.9 }
  }
}

const emptyContent = (): FeatureContent => ({ title: '', grade: '', description: '' })

// ─── Sub-components ───────────────────────────────────────────────────────────

function GradeSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      className="w-full bg-stone-900 border border-stone-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-stone-500"
      style={{ colorScheme: 'dark' }}>
      <option value="">— Grade (YDS) —</option>
      {YDS_GROUPS.map(([label, grades]) => (
        <optgroup key={label} label={label}>
          {grades.map(g => <option key={g} value={g}>{g}</option>)}
        </optgroup>
      ))}
    </select>
  )
}

function GradeConversions({ grade }: { grade: string }) {
  const c = CONVERSIONS[grade]
  if (!c) return null
  return (
    <div className="grid grid-cols-4 gap-1 pt-1.5 pb-0.5">
      {(['french', 'uiaa', 'uk', 'aus'] as const).map(sys => (
        <div key={sys} className="text-center">
          <div className="text-[9px] text-stone-600 uppercase tracking-wide mb-0.5">
            {sys === 'uiaa' ? 'UIAA' : sys === 'aus' ? 'Aus' : sys === 'french' ? 'Fr' : 'UK'}
          </div>
          <div className="text-xs font-medium text-stone-300">{c[sys]}</div>
        </div>
      ))}
    </div>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] font-semibold text-stone-600 uppercase tracking-widest mb-1">{label}</div>
      <div className="space-y-0.5">{children}</div>
    </div>
  )
}

function ToolBtn({ icon, label, active, color, onClick }: {
  icon: string; label: string; active: boolean; color: 'red' | 'blue'; onClick: () => void
}) {
  return (
    <button onClick={onClick}
      className={`w-full flex items-center gap-2 text-left px-2 py-1.5 rounded text-xs font-medium transition-colors ${
        active
          ? color === 'red' ? 'bg-red-600/80 text-white' : 'bg-blue-600/80 text-white'
          : 'text-stone-500 hover:text-white hover:bg-stone-800'
      }`}>
      <span className="w-4 text-center font-mono shrink-0">{icon}</span>
      {label}
    </button>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function TopoEditor() {
  const mapRef         = useRef<HTMLDivElement>(null)
  const mapInst        = useRef<any>(null)
  const imageOverlay   = useRef<any>(null)
  const L              = useRef<any>(null)
  const pendingLoad    = useRef<any[] | null>(null)
  const modeRef     = useRef<DrawMode>('route')
  const featuresRef = useRef<TopoFeature[]>([])
  const layerMap    = useRef<Map<string, any>>(new Map())
  const imageDims   = useRef<{ w: number; h: number } | null>(null)
  const draw        = useRef<{ points: [number, number][]; layer: any; mode: LineMode }>({ points: [], layer: null, mode: 'route' })

  // Undo / redo stacks — plain refs so mutations are synchronous
  const undoStack = useRef<Command[]>([])
  const redoStack = useRef<Command[]>([])
  const backgroundDataRef = useRef<string | null>(null)   // base64 data URL of newly loaded image
  const backgroundPathRef = useRef<string | null>(null)   // server path of previously saved background
  const pendingBackground = useRef<string | null>(null)   // background URL to apply after map init

  const [mode,       setModeState]  = useState<DrawMode>('route')
  const [features,   setFeatures]   = useState<TopoFeature[]>([])
  const [loaded,     setLoaded]     = useState(false)
  const [isDrawing,  setIsDrawing]  = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [canUndo,    setCanUndo]    = useState(false)
  const [canRedo,    setCanRedo]    = useState(false)
  const [bgOpacity,  setBgOpacity]  = useState(1)
  const [topoSlug,   setTopoSlug]   = useState('')
  const [loadSlug,   setLoadSlug]   = useState('')
  const [loadStatus, setLoadStatus] = useState<null | 'loading' | 'loaded' | 'error'>(null)
  const [saveStatus, setSaveStatus] = useState<null | 'saving' | 'saved' | 'error'>(null)
  const [copied,     setCopied]     = useState(false)

  const setMode = useCallback((m: DrawMode) => { modeRef.current = m; setModeState(m) }, [])

  // ─── Sync helpers ─────────────────────────────────────────────────────────

  const sync = useCallback(() => setFeatures([...featuresRef.current]), [])

  const refreshUndoRedo = useCallback(() => {
    setCanUndo(undoStack.current.length > 0)
    setCanRedo(redoStack.current.length > 0)
  }, [])

  // ─── Undo / redo ──────────────────────────────────────────────────────────

  const execute = useCallback((cmd: Command) => {
    cmd.redo()
    undoStack.current.push(cmd)
    redoStack.current = []
    refreshUndoRedo()
  }, [refreshUndoRedo])

  const undo = useCallback(() => {
    const cmd = undoStack.current.pop()
    if (!cmd) return
    cmd.undo()
    redoStack.current.push(cmd)
    refreshUndoRedo()
  }, [refreshUndoRedo])

  const redo = useCallback(() => {
    const cmd = redoStack.current.pop()
    if (!cmd) return
    cmd.redo()
    undoStack.current.push(cmd)
    refreshUndoRedo()
  }, [refreshUndoRedo])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey
      if (!mod) return
      if (e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        if (draw.current.points.length > 0) {
          // Undo the last in-progress point
          draw.current.points = draw.current.points.slice(0, -1)
          if (draw.current.points.length === 0) {
            if (draw.current.layer && mapInst.current) mapInst.current.removeLayer(draw.current.layer)
            draw.current.layer = null
            setIsDrawing(false)
          } else {
            draw.current.layer?.setLatLngs(draw.current.points)
          }
        } else {
          undo()
        }
      }
      if ((e.key === 'z' && e.shiftKey) || e.key === 'y') { e.preventDefault(); redo() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [undo, redo])

  // ─── Feature management ───────────────────────────────────────────────────

  const addFeature = useCallback((f: TopoFeature, layer: any) => {
    execute({
      redo: () => {
        if (mapInst.current) layer.addTo(mapInst.current)
        featuresRef.current = [...featuresRef.current, f]
        layerMap.current.set(f.id, layer)
        sync()
      },
      undo: () => {
        if (mapInst.current) mapInst.current.removeLayer(layer)
        layerMap.current.delete(f.id)
        featuresRef.current = featuresRef.current.filter(x => x.id !== f.id)
        sync()
        setSelectedId(prev => prev === f.id ? null : prev)
      },
    })
  }, [execute, sync])

  const removeFeature = useCallback((id: string) => {
    const f = featuresRef.current.find(x => x.id === id)
    const layer = layerMap.current.get(id)
    if (!f || !layer) return
    execute({
      redo: () => {
        if (mapInst.current) mapInst.current.removeLayer(layer)
        layerMap.current.delete(id)
        featuresRef.current = featuresRef.current.filter(x => x.id !== id)
        sync()
        setSelectedId(prev => prev === id ? null : prev)
      },
      undo: () => {
        if (mapInst.current) layer.addTo(mapInst.current)
        layerMap.current.set(id, layer)
        featuresRef.current = [...featuresRef.current, f]
        sync()
      },
    })
  }, [execute, sync])

  // Content updates are NOT tracked in undo (too granular)
  const updateFeature = useCallback((id: string, patch: Partial<TopoFeature>) => {
    featuresRef.current = featuresRef.current.map(f => f.id === id ? { ...f, ...patch } as TopoFeature : f)
    sync()
  }, [sync])

  // ─── Drawing ──────────────────────────────────────────────────────────────

  const cancelDrawing = useCallback(() => {
    const d = draw.current
    if (d.layer && mapInst.current) mapInst.current.removeLayer(d.layer)
    draw.current = { points: [], layer: null, mode: modeRef.current as LineMode }
    setIsDrawing(false)
  }, [])

  const finishLine = useCallback(() => {
    const d = draw.current
    const Lc = L.current
    if (!Lc || !mapInst.current || d.points.length < 2) { cancelDrawing(); return }
    if (d.layer) mapInst.current.removeLayer(d.layer)

    const imagePts = d.points.map(([lat, lng]) => latlngToImage(lat, lng))
    const id = `line-${Date.now()}`

    let layer: any
    let feature: TopoFeature

    if (d.mode === 'rock') {
      layer = Lc.polygon(d.points, {
        color: '#292524', weight: 2.5, opacity: 0.9,
        fillColor: '#e7e5e4', fillOpacity: 0.7,
        pane: 'rockPane',
      })
      feature = { id, type: 'rock', points: imagePts }
    } else {
      layer = Lc.polyline(d.points, { ...lineStyle(d.mode), pane: 'routePane' })
      feature = d.mode === 'route'
        ? { id, type: 'route',     points: imagePts, label: '', content: emptyContent() }
        : { id, type: 'topo-line', style: d.mode as Exclude<LineMode,'route'|'rock'>, points: imagePts }
    }

    layer.on('click', () => setSelectedId(id))
    addFeature(feature, layer)
    draw.current = { points: [], layer: null, mode: 'route' }
    setIsDrawing(false)
  }, [addFeature, cancelDrawing])

  // ─── Reconstruct from saved JSON ──────────────────────────────────────────

  const reconstructFeatures = useCallback((saved: any[], map: any, Lm: any) => {
    // Clear current layers + state
    featuresRef.current.forEach(f => {
      const layer = layerMap.current.get(f.id)
      if (layer && map) map.removeLayer(layer)
    })
    featuresRef.current = []
    layerMap.current.clear()
    undoStack.current = []
    redoStack.current = []

    const toLatlng = ([x, y]: [number, number]): [number, number] => [-y, x]

    saved.forEach((f, idx) => {
      const id = `${f.type}-${idx}-${Date.now()}`

      if (f.type === 'rock') {
        const pts = (f.points as [number, number][]).map(toLatlng)
        const layer = Lm.polygon(pts, { color: '#292524', weight: 2.5, opacity: 0.9, fillColor: '#e7e5e4', fillOpacity: 0.7, pane: 'rockPane' })
        layer.on('click', () => setSelectedId(id))
        layer.addTo(map)
        featuresRef.current.push({ id, type: 'rock', points: f.points } as RockFeature)
        layerMap.current.set(id, layer)

      } else if (f.type === 'route') {
        const pts = (f.points as [number, number][]).map(toLatlng)
        const layer = Lm.polyline(pts, { color: '#dc2626', weight: 3, opacity: 0.95, pane: 'routePane' })
        layer.on('click', () => setSelectedId(id))
        layer.addTo(map)
        featuresRef.current.push({ id, type: 'route', points: f.points, label: f.label ?? '', content: { title: f.title ?? '', grade: f.grade ?? '', description: f.description ?? '', imageName: f.imageName } } as RouteFeature)
        layerMap.current.set(id, layer)

      } else if (f.type === 'topo-line') {
        const pts = (f.points as [number, number][]).map(toLatlng)
        const layer = Lm.polyline(pts, { ...lineStyle(f.style), pane: 'routePane' })
        layer.on('click', () => setSelectedId(id))
        layer.addTo(map)
        featuresRef.current.push({ id, type: 'topo-line', style: f.style, points: f.points } as TopoLineFeature)
        layerMap.current.set(id, layer)

      } else if (f.type === 'belay') {
        const pitch: number = f.pitch
        const latlng = toLatlng(f.position as [number, number])
        const layer = Lm.circleMarker(latlng, { radius: 11, color: '#fff', fillColor: '#1d4ed8', fillOpacity: 1, weight: 2, pane: 'pointPane' })
        layer.bindTooltip(String(pitch), { permanent: true, direction: 'center', className: 'lf-belay' })
        layer.on('click', () => setSelectedId(id))
        layer.addTo(map)
        featuresRef.current.push({ id, type: 'belay', pitch, position: f.position, content: { title: f.title ?? '', grade: f.grade ?? '', description: f.description ?? '', imageName: f.imageName } } as BelayFeature)
        layerMap.current.set(id, layer)

      } else if (f.type === 'annotation') {
        const latlng = toLatlng(f.position as [number, number])
        const label = f.label ?? 'Note'
        const layer = Lm.circleMarker(latlng, { radius: 5, color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: 1, weight: 2, pane: 'pointPane' })
        layer.bindTooltip(label, { permanent: true, direction: 'right', className: 'lf-ann' })
        layer.on('click', () => setSelectedId(id))
        layer.addTo(map)
        featuresRef.current.push({ id, type: 'annotation', position: f.position, label, content: { title: f.title ?? '', grade: '', description: f.description ?? '', imageName: f.imageName } } as AnnotationFeature)
        layerMap.current.set(id, layer)
      }
    })

    setSelectedId(null)
    setCanUndo(false)
    setCanRedo(false)
    sync()
  }, [sync])

  // ─── Map init ─────────────────────────────────────────────────────────────

  const initMap = useCallback((imageUrl: string, w: number, h: number) => {
    if (!mapRef.current) return
    imageDims.current = { w, h }

    import('leaflet').then((Lm) => {
      L.current = Lm

      if (!document.getElementById('lf-css')) {
        const link = document.createElement('link')
        link.id = 'lf-css'; link.rel = 'stylesheet'
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
        document.head.appendChild(link)
      }
      if (!document.getElementById('topo-css')) {
        const s = document.createElement('style'); s.id = 'topo-css'
        s.textContent = `
          .lf-belay{background:#1d4ed8;border:2px solid #fff;color:#fff;font-size:11px;font-weight:700;padding:1px 5px;border-radius:50%;min-width:20px;text-align:center;box-shadow:none}
          .lf-belay::before{display:none}
          .lf-ann{background:#78350f;border:1px solid #f59e0b;color:#fef3c7;font-size:11px;font-weight:500;padding:2px 6px;border-radius:4px;white-space:nowrap;box-shadow:none}
          .lf-ann::before{display:none}
          .leaflet-container{background:#111}
        `
        document.head.appendChild(s)
      }

      if (mapInst.current) mapInst.current.remove()

      const bounds: [[number, number],[number, number]] = [[-h, 0], [0, w]]
      const map = Lm.map(mapRef.current!, {
        crs: Lm.CRS.Simple, minZoom: -3, maxZoom: 5, zoomSnap: 0.25,
        attributionControl: false, doubleClickZoom: false,
      })
      imageOverlay.current = Lm.imageOverlay(imageUrl, bounds).addTo(map)

      // Layering: photo (overlayPane 400) → rockPane → routePane → pointPane → tooltips (650)
      map.createPane('rockPane').style.zIndex  = '401'
      map.createPane('routePane').style.zIndex = '450'
      map.createPane('pointPane').style.zIndex = '500'

      map.fitBounds(bounds, { padding: [20, 20] })
      mapInst.current = map

      map.on('click', (e: any) => {
        const m = modeRef.current
        const { lat, lng } = e.latlng
        const [ix, iy] = latlngToImage(lat, lng)
        const d = draw.current

        if (isLineMode(m)) {
          if (d.points.length === 0) d.mode = m
          d.points = [...d.points, [lat, lng] as [number, number]]
          const style = d.mode === 'rock'
            ? { color: '#d6d3d1', weight: 2.5, opacity: 0.75, dashArray: '8 5' }
            : { ...lineStyle(d.mode), opacity: 0.55, dashArray: '8 5' }
          if (d.layer) d.layer.setLatLngs(d.points)
          else d.layer = Lm.polyline(d.points, style).addTo(map)
          setIsDrawing(true)

        } else if (m === 'belay') {
          const existingPitches = (featuresRef.current.filter(f => f.type === 'belay') as BelayFeature[]).map(b => b.pitch)
          const pitch = existingPitches.length > 0 ? Math.max(...existingPitches) + 1 : 1
          const id = `belay-${Date.now()}`
          const layer = Lm.circleMarker([lat, lng], { radius: 11, color: '#fff', fillColor: '#1d4ed8', fillOpacity: 1, weight: 2, pane: 'pointPane' })
          layer.bindTooltip(String(pitch), { permanent: true, direction: 'center', className: 'lf-belay' })
          layer.on('click', () => setSelectedId(id))
          addFeature({ id, type: 'belay', position: [ix, iy], pitch, content: emptyContent() }, layer)
          setSelectedId(id)

        } else if (m === 'annotation') {
          const label = window.prompt('Annotation label:')
          if (!label) return
          const id = `ann-${Date.now()}`
          const layer = Lm.circleMarker([lat, lng], { radius: 5, color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: 1, weight: 2, pane: 'pointPane' })
          layer.bindTooltip(label, { permanent: true, direction: 'right', className: 'lf-ann' })
          layer.on('click', () => setSelectedId(id))
          addFeature({ id, type: 'annotation', position: [ix, iy], label, content: emptyContent() }, layer)
          setSelectedId(id)
        }
      })

      map.on('dblclick', () => {
        if (draw.current.points.length >= 2) finishLine()
        else cancelDrawing()
      })

      if (pendingLoad.current) {
        reconstructFeatures(pendingLoad.current, map, Lm)
        pendingLoad.current = null
      }
      if (pendingBackground.current) {
        imageOverlay.current?.setUrl(pendingBackground.current)
        pendingBackground.current = null
      }
      setLoaded(true)
    })
  }, [addFeature, cancelDrawing, finishLine, reconstructFeatures])

  // ─── File handling ────────────────────────────────────────────────────────

  const handleImage = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => initMap(url, img.width, img.height)
    img.src = url
    // Read as base64 so it can be saved to the server
    const reader = new FileReader()
    reader.onload = ev => { backgroundDataRef.current = ev.target?.result as string ?? null }
    reader.readAsDataURL(file)
    backgroundPathRef.current = null
    featuresRef.current = []
    layerMap.current.clear()
    undoStack.current = []
    redoStack.current = []
    draw.current = { points: [], layer: null, mode: 'route' }
    setFeatures([]); setIsDrawing(false); setSelectedId(null)
    setCanUndo(false); setCanRedo(false); setLoaded(false); setBgOpacity(1)
  }, [initMap])

  const loadTopo = useCallback(async () => {
    const slug = loadSlug.trim()
    if (!slug) return
    setLoadStatus('loading')
    try {
      const res = await fetch(`/api/topo?slug=${encodeURIComponent(slug)}`)
      if (!res.ok) { setLoadStatus('error'); return }
      const { data } = await res.json()

      setTopoSlug(slug)

      // Track loaded background path so re-saving preserves it
      backgroundDataRef.current = null
      backgroundPathRef.current = data.backgroundImage ?? null
      const bgUrl = data.backgroundImage ?? null

      if (mapInst.current && L.current) {
        // Map already initialised — reconstruct directly
        reconstructFeatures(data.features, mapInst.current, L.current)
        if (bgUrl) imageOverlay.current?.setUrl(bgUrl)
      } else {
        // Init map from stored dimensions using a transparent placeholder
        const { w, h } = data.image
        pendingLoad.current = data.features
        if (bgUrl) pendingBackground.current = bgUrl
        const placeholder = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQAABjE+ibYAAAAASUVORK5CYII='
        featuresRef.current = []
        layerMap.current.clear()
        undoStack.current = []
        redoStack.current = []
        draw.current = { points: [], layer: null, mode: 'route' }
        setFeatures([]); setIsDrawing(false); setSelectedId(null)
        setCanUndo(false); setCanRedo(false); setLoaded(false); setBgOpacity(1)
        initMap(placeholder, w, h)
      }

      setLoadStatus('loaded')
      setTimeout(() => setLoadStatus(null), 2000)
    } catch {
      setLoadStatus('error')
    }
  }, [loadSlug, initMap, reconstructFeatures])

  // ─── Content editing ──────────────────────────────────────────────────────

  const updateContent = useCallback((id: string, field: keyof FeatureContent, value: string) => {
    const f = featuresRef.current.find(x => x.id === id)
    if (!f || (f.type !== 'belay' && f.type !== 'annotation' && f.type !== 'route')) return
    updateFeature(id, { content: { ...(f as BelayFeature | AnnotationFeature | RouteFeature).content, [field]: value } } as Partial<TopoFeature>)
  }, [updateFeature])

  const handleContentImage = useCallback((id: string, e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const f = featuresRef.current.find(x => x.id === id)
    if (!f || (f.type !== 'belay' && f.type !== 'annotation' && f.type !== 'route')) return
    const reader = new FileReader()
    const fc = (f as BelayFeature | AnnotationFeature | RouteFeature).content
    reader.onload = ev => updateFeature(id, {
      content: { ...fc, imageDataUrl: ev.target?.result as string, imageName: file.name }
    } as Partial<TopoFeature>)
    reader.readAsDataURL(file)
  }, [updateFeature])

  // ─── Save / export ────────────────────────────────────────────────────────

  const buildData = useCallback(() => ({
    image: imageDims.current,
    backgroundDataUrl: backgroundDataRef.current ?? undefined,
    backgroundImage: backgroundDataRef.current ? undefined : backgroundPathRef.current ?? undefined,
    features: featuresRef.current.map(f => {
      if (f.type === 'rock')      return { type: 'rock',      points: f.points }
      if (f.type === 'route')     return { type: 'route',     points: f.points, label: f.label, title: f.content.title, grade: f.content.grade, description: f.content.description, imageDataUrl: f.content.imageDataUrl, imageName: f.content.imageName }
      if (f.type === 'topo-line') return { type: 'topo-line', style: f.style,   points: f.points }
      if (f.type === 'belay')     return { type: 'belay', pitch: f.pitch, position: f.position, title: f.content.title, grade: f.content.grade, description: f.content.description, imageDataUrl: f.content.imageDataUrl, imageName: f.content.imageName }
      return { type: 'annotation', label: (f as AnnotationFeature).label, position: f.position, title: f.content.title, description: f.content.description, imageDataUrl: f.content.imageDataUrl, imageName: f.content.imageName }
    }),
  }), [])

  const save = useCallback(async () => {
    const slug = topoSlug.trim()
    if (!slug || !loaded) return
    setSaveStatus('saving')
    try {
      const res = await fetch('/api/topo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, data: buildData() }),
      })
      const result = await res.json()
      setSaveStatus(result.success ? 'saved' : 'error')
      if (result.success) setTimeout(() => setSaveStatus(null), 2000)
    } catch { setSaveStatus('error') }
  }, [topoSlug, loaded, buildData])

  const copyJson = useCallback(async () => {
    const data = buildData()
    const clean = { ...data, features: data.features.map((f: Record<string, unknown>) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { imageDataUrl, imageName, ...rest } = f; return rest
    })}
    await navigator.clipboard.writeText(JSON.stringify(clean, null, 2))
    setCopied(true); setTimeout(() => setCopied(false), 1500)
  }, [buildData])

  // ─── Derived ──────────────────────────────────────────────────────────────

  const selectedFeature = features.find(f => f.id === selectedId) ?? null
  const hasContent = selectedFeature?.type === 'belay' || selectedFeature?.type === 'annotation' || selectedFeature?.type === 'route'
  const selContent = hasContent ? (selectedFeature as BelayFeature | AnnotationFeature | RouteFeature).content : null

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen bg-stone-950 text-white overflow-hidden" style={{ fontFamily: 'var(--font-geist-sans, system-ui)' }}>

      {/* Map */}
      <div className="flex-1 relative min-w-0">
        {!loaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10">
            <p className="text-stone-500 text-sm">Load a photo to start drawing</p>
            <label className="cursor-pointer bg-stone-800 hover:bg-stone-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors">
              Choose image
              <input type="file" accept="image/*,.heic,.heif" className="hidden" onChange={handleImage} />
            </label>
          </div>
        )}
        <div ref={mapRef} className="w-full h-full"
          style={{ cursor: loaded ? (isLineMode(mode) ? 'crosshair' : mode === 'belay' ? 'cell' : 'pointer') : 'default' }} />
        {loaded && (
          <div className="absolute bottom-4 left-4 bg-black/65 backdrop-blur-sm text-white/70 text-xs px-3 py-1.5 rounded-lg pointer-events-none">
            {isLineMode(mode) && !isDrawing && 'Click to start · double-click to finish'}
            {isLineMode(mode) &&  isDrawing && `${draw.current.points.length} pts · double-click to finish`}
            {mode === 'belay'      && 'Click to place belay station'}
            {mode === 'annotation' && 'Click to place annotation'}
          </div>
        )}
      </div>

      {/* Right panel */}
      <div className="w-64 flex flex-col border-l border-stone-800 bg-stone-900 shrink-0 overflow-hidden">

        {/* Undo / redo bar */}
        <div className="flex items-center gap-1 px-3 py-2 border-b border-stone-800 shrink-0">
          <button onClick={undo} disabled={!canUndo} title="Undo (⌘Z)"
            className={`flex-1 py-1 rounded text-xs font-medium transition-colors ${canUndo ? 'text-stone-300 hover:bg-stone-800' : 'text-stone-700 cursor-not-allowed'}`}>
            ↩ Undo
          </button>
          <div className="w-px h-4 bg-stone-800" />
          <button onClick={redo} disabled={!canRedo} title="Redo (⌘⇧Z)"
            className={`flex-1 py-1 rounded text-xs font-medium transition-colors ${canRedo ? 'text-stone-300 hover:bg-stone-800' : 'text-stone-700 cursor-not-allowed'}`}>
            ↪ Redo
          </button>
        </div>

        {/* Photo opacity */}
        {loaded && (
          <div className="px-3 py-2 border-b border-stone-800 shrink-0 flex items-center gap-2">
            <span className="text-[10px] text-stone-600 shrink-0">Photo</span>
            <input type="range" min="0" max="1" step="0.02" value={bgOpacity}
              onChange={e => {
                const v = parseFloat(e.target.value)
                setBgOpacity(v)
                if (imageOverlay.current) imageOverlay.current.setOpacity(v)
              }}
              className="flex-1 accent-stone-400 h-1" />
            <span className="text-[10px] text-stone-500 w-7 text-right tabular-nums">{Math.round(bgOpacity * 100)}%</span>
          </div>
        )}

        {/* Tools */}
        <div className="p-3 border-b border-stone-800 shrink-0 space-y-3">
          <Section label="Background">
            <ToolBtn icon="◻" label="Rock outline" active={mode==='rock'} color="red" onClick={() => setMode('rock')} />
          </Section>
          <Section label="Lines">
            {([['route','—','Route'],['ledge','━','Ledge'],['crack','┄','Crack system'],['roof','⌐','Roof / overhang']] as [DrawMode,string,string][]).map(([m,icon,label]) => (
              <ToolBtn key={m} icon={icon} label={label} active={mode===m} color="red" onClick={() => setMode(m)} />
            ))}
          </Section>
          <Section label="Points">
            {([['belay','●','Belay / pitch start'],['annotation','◆','Annotation']] as [DrawMode,string,string][]).map(([m,icon,label]) => (
              <ToolBtn key={m} icon={icon} label={label} active={mode===m} color="blue" onClick={() => setMode(m)} />
            ))}
          </Section>
          {isDrawing && (
            <div className="flex items-center justify-between pt-2 border-t border-stone-800">
              <span className="text-[10px] text-amber-400 font-medium">Line in progress</span>
              <button onClick={cancelDrawing} className="text-[10px] text-red-400 hover:text-red-300">Discard</button>
            </div>
          )}
        </div>

        {/* Content editor */}
        {hasContent && selectedFeature && selContent && (
          <div className="p-3 border-b border-stone-800 bg-stone-800/40 shrink-0">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest">
                {selectedFeature.type === 'belay' ? `Pitch ${(selectedFeature as BelayFeature).pitch}`
                  : selectedFeature.type === 'route' ? `Route (${selectedFeature.points.length} pts)`
                  : (selectedFeature as AnnotationFeature).label}
              </span>
              <button onClick={() => setSelectedId(null)} className="text-stone-600 hover:text-stone-300 text-xs">✕</button>
            </div>
            <div className="space-y-1.5">
              <input type="text" placeholder="Title"
                value={selContent.title}
                onChange={e => updateContent(selectedFeature.id, 'title', e.target.value)}
                className="w-full bg-stone-900 border border-stone-700 rounded px-2 py-1 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-stone-500" />
              {(selectedFeature.type === 'belay' || selectedFeature.type === 'route') && (
                <div>
                  <GradeSelect value={selContent.grade} onChange={v => updateContent(selectedFeature.id, 'grade', v)} />
                  {selContent.grade && <GradeConversions grade={selContent.grade} />}
                </div>
              )}
              <textarea placeholder="Description / beta" value={selContent.description}
                onChange={e => updateContent(selectedFeature.id, 'description', e.target.value)}
                rows={3}
                className="w-full bg-stone-900 border border-stone-700 rounded px-2 py-1 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-stone-500 resize-none" />
              {selContent.imageDataUrl ? (
                <div className="relative">
                  <img src={selContent.imageDataUrl} alt="preview" className="w-full h-20 object-cover rounded" />
                  <button
                    onClick={() => updateFeature(selectedFeature.id, { content: { ...selContent, imageDataUrl: undefined, imageName: undefined } } as Partial<TopoFeature>)}
                    className="absolute top-1 right-1 bg-black/70 text-white text-[10px] px-1 py-0.5 rounded">✕</button>
                </div>
              ) : (
                <label className="flex items-center gap-1.5 cursor-pointer text-xs text-stone-500 hover:text-stone-300 transition-colors">
                  <span>＋</span> Attach photo
                  <input type="file" accept="image/*" className="hidden" onChange={e => handleContentImage(selectedFeature.id, e)} />
                </label>
              )}
              <p className="text-[10px] text-stone-700 leading-relaxed">Becomes a scroll chapter in the topo viewer.</p>
            </div>
          </div>
        )}

        {/* Feature list */}
        <div className="flex-1 overflow-y-auto p-3 min-h-0">
          <div className="text-[10px] font-semibold text-stone-500 uppercase tracking-widest mb-2">
            Features{features.length > 0 ? ` (${features.length})` : ''}
          </div>
          {features.length === 0
            ? <p className="text-xs text-stone-700 italic">None yet</p>
            : (
              <div className="space-y-1">
                {features.map(f => (
                  <div key={f.id}
                    onClick={() => (f.type === 'belay' || f.type === 'annotation' || f.type === 'route') && setSelectedId(f.id)}
                    className={`flex items-center justify-between rounded px-2 py-1.5 text-xs transition-colors ${
                      f.id === selectedId ? 'bg-stone-700 text-white' : 'bg-stone-800/50 text-stone-400 hover:text-stone-200 hover:bg-stone-800'
                    } cursor-pointer`}>
                    <span className="truncate">
                      {f.type === 'rock'       && `Rock outline (${f.points.length} pts)`}
                      {f.type === 'route'      && `Route${f.content.title ? ` · ${f.content.title}` : ''}${f.content.grade ? ` · ${f.content.grade}` : ''} (${f.points.length} pts)`}
                      {f.type === 'topo-line'  && `${f.style.charAt(0).toUpperCase()+f.style.slice(1)} (${f.points.length} pts)`}
                      {f.type === 'belay'      && `Pitch ${f.pitch}${f.content.grade ? ` · ${f.content.grade}` : ''}${f.content.title ? ` · ${f.content.title}` : ''}`}
                      {f.type === 'annotation' && f.label}
                    </span>
                    <button onClick={e => { e.stopPropagation(); removeFeature(f.id) }}
                      className="ml-2 shrink-0 text-stone-700 hover:text-red-400 transition-colors">✕</button>
                  </div>
                ))}
              </div>
            )
          }
        </div>

        {/* Load */}
        <div className="border-t border-stone-800 p-3 shrink-0 space-y-2">
          <div className="text-[10px] font-semibold text-stone-500 uppercase tracking-widest">Load</div>
          <div className="flex gap-1.5">
            <input type="text" placeholder="slug to load"
              value={loadSlug} onChange={e => setLoadSlug(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && loadTopo()}
              className="flex-1 min-w-0 bg-stone-950 border border-stone-700 rounded px-2 py-1.5 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-stone-500" />
            <button onClick={loadTopo} disabled={!loadSlug.trim() || loadStatus === 'loading'}
              className={`shrink-0 px-2.5 rounded text-xs font-medium transition-colors ${
                loadStatus === 'loaded' ? 'bg-green-700 text-white' :
                loadStatus === 'error'  ? 'bg-red-700 text-white' :
                loadStatus === 'loading' ? 'bg-stone-700 text-stone-400 cursor-wait' :
                !loadSlug.trim() ? 'bg-stone-800 text-stone-600 cursor-not-allowed' :
                'bg-stone-700 hover:bg-stone-600 text-white'
              }`}>
              {loadStatus === 'loading' ? '…' : loadStatus === 'loaded' ? '✓' : loadStatus === 'error' ? '✗' : 'Load'}
            </button>
          </div>
          {loaded && loadStatus === 'loaded' && (
            <p className="text-[10px] text-stone-600">Load a background photo below to see the image.</p>
          )}
        </div>

        {/* Save */}
        <div className="border-t border-stone-800 p-3 shrink-0 space-y-2">
          <div className="text-[10px] font-semibold text-stone-500 uppercase tracking-widest">Save</div>
          <input type="text" placeholder="slug (e.g. ariana-diamond)"
            value={topoSlug} onChange={e => setTopoSlug(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && save()}
            className="w-full bg-stone-950 border border-stone-700 rounded px-2 py-1.5 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-stone-500" />
          <button onClick={save}
            disabled={!topoSlug.trim() || !loaded || saveStatus === 'saving'}
            className={`w-full rounded py-1.5 text-xs font-semibold transition-colors ${
              saveStatus === 'saved'  ? 'bg-green-700 text-white' :
              saveStatus === 'error'  ? 'bg-red-700 text-white' :
              saveStatus === 'saving' ? 'bg-stone-700 text-stone-400 cursor-wait' :
              !topoSlug.trim() || !loaded ? 'bg-stone-800 text-stone-600 cursor-not-allowed' :
              'bg-stone-700 hover:bg-stone-600 text-white'
            }`}>
            {saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? '✓ Saved' : saveStatus === 'error' ? '✗ Failed' : 'Save'}
          </button>
          <div className="flex justify-between pt-0.5">
            <label className="cursor-pointer text-[10px] text-stone-600 hover:text-stone-400 transition-colors">
              New image <input type="file" accept="image/*,.heic,.heif" className="hidden" onChange={handleImage} />
            </label>
            <button onClick={copyJson} className="text-[10px] text-stone-600 hover:text-stone-400 transition-colors">
              {copied ? '✓ Copied' : 'Copy JSON'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
