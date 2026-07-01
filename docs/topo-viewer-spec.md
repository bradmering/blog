# Topo Viewer — Frontend Spec

The topo viewer is a scroll-driven climbing route experience that reuses the same architecture as `components/GeoStory/`. The core idea: a Leaflet `CRS.Simple` topo stays pinned to the background while the user scrolls through pitch-by-pitch narrative chapters in the foreground. At each chapter, the topo zooms into the relevant section and the background photo can fade out to let a pitch photo take the frame.

---

## How it maps to GeoStory

| GeoStory concept | Topo Viewer equivalent |
|---|---|
| Mapbox GL map (sticky background) | Leaflet `CRS.Simple` topo (sticky background) |
| `map.flyTo({ center, zoom })` | `map.flyTo(latlng, zoom, { duration, easeLinearity })` |
| `routeProgress` → draws GPX line | `routeProgress` → draws route line up to current pitch |
| `MapChapter` (lat/lng + zoom) | `TopoChapter` (image-space bounds + photo + fade) |
| `IntersectionObserver` at ±45% | Same — no changes needed |
| Dot nav on right edge | Same component |
| `TitleChapter`, `SplashChapter` | Reused as-is (splash = hero photo of the wall) |
| `GalleryChapter`, `ArticleChapter` | Reused as-is for approach/descent/trip notes |

The shared scroll observer, sticky map layout CSS, and chapter type system all stay identical. The topo viewer adds one new component family: `TopoStory/`.

---

## Component structure

```
components/
  GeoStory/          ← unchanged
    index.tsx
    types.ts
    TitleChapter.tsx
    SplashChapter.tsx
    GalleryChapter.tsx
    ArticleChapter.tsx
    VideoChapter.tsx
    Loader.tsx
  TopoStory/         ← new, mirrors GeoStory
    index.tsx        ← main component (Leaflet CRS.Simple + scroll logic)
    types.ts         ← TopoStory, TopoChapter, TopoData types
    PitchChapter.tsx ← the topo-specific chapter panel
    Loader.tsx       ← async wrapper (same pattern as GeoStory/Loader)
```

`TopoStory/index.tsx` can share `TitleChapter`, `SplashChapter`, `GalleryChapter`, `ArticleChapter`, and `VideoChapter` directly from `GeoStory/` — no copies needed. The chapter type union just adds `TopoChapter` alongside the existing types.

---

## Data model

### `content/topos/[slug].json` (editor output, already exists)

```json
{
  "image": { "w": 1200, "h": 1083 },
  "features": [
    { "type": "rock", "points": [[x,y],...] },
    { "type": "route", "points": [[x,y],...], "grade": "5.10d", "title": "Ariana" },
    { "type": "topo-line", "style": "ledge", "points": [[x,y],...] },
    {
      "type": "belay", "pitch": 1, "position": [366, 928],
      "title": "What the ...? (50m)", "grade": "5.11a",
      "description": "Three hard bolts right off the ledge...",
      "image": "/images/topos/ariana-diamond/belay-0.jpg"
    }
  ]
}
```

### `content/stories/[slug].yaml` (story chapters, already exists)

Topo chapters live inline with the other chapter types. Add a `topo` chapter type:

```yaml
chapters:
  - id: title
    type: title
    heading: Ariana — The Diamond
    subheading: Longs Peak, Colorado · 5.11a

  - id: approach
    type: splash
    image: /images/topos/ariana-diamond/wall.jpg

  - id: pitch-1
    type: topo
    topoSlug: ariana-diamond        # which topo JSON to load
    pitch: 1                        # maps to belay.pitch in the JSON
    # bounds to zoom into (image coords, top-left origin):
    bounds: [[250, 800], [500, 1083]]
    bgOpacity: 0.3                  # fade the photo (0=topo only, 1=full photo)
    foregroundImage: /images/topos/ariana-diamond/pitch1-crux.jpg
    foregroundAlign: right          # left | right | center | full

  - id: pitch-2
    type: topo
    topoSlug: ariana-diamond
    pitch: 2
    bounds: [[250, 650], [500, 850]]
    bgOpacity: 0.0
    foregroundImage: /images/topos/ariana-diamond/pitch2-crack.jpg
    foregroundAlign: left

  - id: summit
    type: gallery
    layout: duo
    images:
      - src: /images/topos/ariana-diamond/summit-1.jpg
      - src: /images/topos/ariana-diamond/summit-2.jpg
```

### New `TopoChapter` type (add to `GeoStory/types.ts` or `TopoStory/types.ts`)

```typescript
export interface TopoChapter {
  id: string
  type: 'topo'
  topoSlug: string
  pitch?: number              // highlights this belay in the topo
  bounds: [[number,number],[number,number]]  // image-space zoom target
  bgOpacity?: number          // 0–1, default 1
  routeProgress?: number      // 0–1, draws route line up to this fraction
  foregroundImage?: string
  foregroundAlign?: 'left' | 'right' | 'center' | 'full'
  heading?: string            // overrides belay.title if provided
  text?: string               // overrides belay.description if provided
  subheading?: string
  align?: 'left' | 'right'   // text panel alignment (same as MapChapter)
}
```

---

## `TopoStory/index.tsx` — key mechanics

### Sticky layout (identical to GeoStory)

```tsx
<div className="relative">
  {/* Pinned topo */}
  <div className="sticky top-14 h-[calc(100vh-3.5rem)] w-full">
    <div ref={mapRef} className="w-full h-full" />
    {/* dot nav — same component */}
  </div>

  {/* Chapters — overlap via negative margin */}
  <div className="-mt-[calc(100vh-3.5rem)] relative">
    {chapters.map((chapter, i) => (
      <div key={chapter.id} ref={el => { chapterRefs.current[i] = el }}>
        {chapter.type === 'topo'    && <PitchChapter chapter={chapter} />}
        {chapter.type === 'title'   && <TitleChapter chapter={chapter} />}
        {chapter.type === 'splash'  && <SplashChapter chapter={chapter} />}
        {chapter.type === 'gallery' && <GalleryChapter chapter={chapter} />}
        {chapter.type === 'article' && <ArticleChapter chapter={chapter} />}
      </div>
    ))}
  </div>
</div>
```

### Scroll detection (identical to GeoStory)

```tsx
// In useEffect — same IntersectionObserver pattern, same threshold
const observer = new IntersectionObserver(
  ([entry]) => { if (entry.isIntersecting) setActiveIdx(i) },
  { threshold: 0, rootMargin: '-45% 0px -45% 0px' }
)
```

### `applyChapter` — topo equivalent of `map.flyTo`

```typescript
function applyChapter(chapter: Chapter, map: L.Map, overlay: L.ImageOverlay) {
  if (chapter.type !== 'topo') return

  // Convert image bounds [x,y] → Leaflet [[lat,lng]] (lat = -y, lng = x)
  const [[x1,y1],[x2,y2]] = chapter.bounds
  const lBounds: L.LatLngBoundsExpression = [[-y2, x1], [-y1, x2]]
  map.flyToBounds(lBounds, { duration: 1.2, easeLinearity: 0.3, padding: [40, 40] })

  // Fade background photo
  overlay.setOpacity(chapter.bgOpacity ?? 1)

  // Advance route line
  if (chapter.routeProgress !== undefined) {
    setRouteProgress(routeLayer, allRoutePoints, chapter.routeProgress)
  }

  // Highlight active belay marker (add a pulse ring or change fill)
  highlightBelay(chapter.pitch)
}
```

### Route progress draw-on (same as GeoStory `setRouteProgress`)

The topo's route feature stores `points: [[x,y],...]` in image coords. On load, convert to Leaflet coords and store as `allRoutePoints`. Each `topo` chapter with `routeProgress` slices the array to the given fraction and updates the polyline:

```typescript
function setRouteProgress(layer: L.Polyline, pts: L.LatLng[], progress: number) {
  const end = Math.round((pts.length - 1) * Math.min(progress, 1))
  layer.setLatLngs(pts.slice(0, end + 1))
}
```

This is structurally identical to `GeoStory.setRouteProgress` — refactor both to share a utility if they drift.

---

## `PitchChapter.tsx` layout

Each topo chapter shows: the text panel (left or right, matching `MapChapter` styling) plus an optional foreground photo on the opposite side.

```
┌─────────────────────────────────────────────────────────────┐  viewport
│  [topo pinned behind — zoomed to this pitch's bounds]       │
│                                                             │
│  ┌──────────────────┐        ┌────────────────────────────┐ │
│  │ Pitch 1          │        │  [pitch photo — right]     │ │
│  │ What the...?     │        │                            │ │
│  │ 5.11a · 50m      │        │  full-bleed, object-cover  │ │
│  │                  │        │  ~40vw wide                │ │
│  │ beta text...     │        │                            │ │
│  └──────────────────┘        └────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

The text panel reuses the exact same `bg-white/75 backdrop-blur-sm shadow-lg` style from `MapChapter`.

```tsx
export default function PitchChapter({ chapter }: { chapter: TopoChapter }) {
  const heading  = chapter.heading  ?? ''
  const text     = chapter.text     ?? ''
  const align    = chapter.align    ?? 'left'

  return (
    <div className="min-h-[85vh] flex items-center py-20 pointer-events-none">
      <div className={`w-full flex gap-8 items-center px-8 sm:px-14 ${align === 'right' ? 'flex-row-reverse' : 'flex-row'}`}>

        {/* Text panel — identical style to MapChapter */}
        <div className="pointer-events-auto bg-white/75 backdrop-blur-sm shadow-lg max-w-sm w-full p-6 shrink-0">
          {chapter.subheading && (
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-400 mb-2">
              {chapter.subheading}
            </p>
          )}
          <h2 className="text-xl font-bold text-stone-900 mb-1 leading-snug tracking-tight">{heading}</h2>
          {chapter.pitch && <p className="text-sm text-stone-400 mb-3">Pitch {chapter.pitch}</p>}
          <p className="text-sm text-stone-600 leading-relaxed">{text}</p>
        </div>

        {/* Foreground photo */}
        {chapter.foregroundImage && (
          <div className="pointer-events-auto flex-1 min-w-0 h-[60vh] overflow-hidden rounded shadow-2xl">
            <img src={chapter.foregroundImage} alt="" className="w-full h-full object-cover" />
          </div>
        )}
      </div>
    </div>
  )
}
```

---

## Shared utilities to extract

When building `TopoStory`, pull these into `lib/topo.ts` so both the editor and viewer stay in sync:

| Utility | Used by |
|---|---|
| `imageCoordsToLeaflet([x,y])` → `[lat,lng]` | editor `reconstructFeatures`, viewer `applyChapter` |
| `leafletToImageCoords([lat,lng])` → `[x,y]` | editor `latlngToImage`, viewer (if editing) |
| `lineStyle(mode)` | editor draw, viewer render |
| Grade conversion table (`CONVERSIONS`) | editor sidebar, future grade-display in viewer |

---

## Build order

1. **`lib/topo.ts`** — extract shared coordinate utils + lineStyle + grade table
2. **`TopoStory/types.ts`** — `TopoChapter`, `TopoStory` (extends `Story` with `topoSlug`)
3. **`TopoStory/index.tsx`** — load topo JSON, init Leaflet, reconstruct layers, scroll observer, `applyChapter`
4. **`TopoStory/PitchChapter.tsx`** — text + foreground photo panel
5. **`TopoStory/Loader.tsx`** — async wrapper (copy `GeoStory/Loader.tsx`, swap component)
6. **`app/stories/[slug]/page.tsx`** — detect `type: topo` in story front matter, render `<TopoStory>` instead of `<GeoStory>`
7. Wire up a story YAML for Ariana to test end-to-end
