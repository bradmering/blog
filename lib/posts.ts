import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { remark } from 'remark'
import remarkGfm from 'remark-gfm'
import remarkHtml from 'remark-html'

export type Tag = 'adventures' | 'reflections' | 'development'

// Coordinates stored in frontmatter — either a single "lat,lng" string
// or an object with start/end for a route
export interface CoordPoint { lat: number; lng: number }
export interface Coordinates {
  start: CoordPoint
  end?: CoordPoint
}

export interface ItineraryStop {
  id: string
  name: string
  dates?: string
  coordinates: [number, number]  // [lng, lat] — Mapbox convention
  zoom?: number
  pitch?: number
  description?: string
}

export interface Post {
  slug: string
  title: string
  date: string
  excerpt: string
  image: string
  imageAlt: string
  tags: Tag[]
  coordinates?: Coordinates
  itinerary?: ItineraryStop[]
  content?: string
}

function parseCoordString(s: unknown): CoordPoint | null {
  if (typeof s !== 'string') return null
  const [latStr, lngStr] = s.split(',').map(v => v.trim())
  const lat = parseFloat(latStr)
  const lng = parseFloat(lngStr)
  if (isNaN(lat) || isNaN(lng)) return null
  return { lat, lng }
}

export function parseCoordinates(raw: unknown): Coordinates | undefined {
  if (!raw) return undefined
  // Single string: "lat,lng"
  if (typeof raw === 'string') {
    const pt = parseCoordString(raw)
    return pt ? { start: pt } : undefined
  }
  // Object: { start: "lat,lng", end?: "lat,lng" }
  if (typeof raw === 'object' && !Array.isArray(raw)) {
    const obj = raw as Record<string, unknown>
    const start = parseCoordString(obj.start)
    if (!start) return undefined
    const end = parseCoordString(obj.end) ?? undefined
    return { start, end }
  }
  // Array of objects: [{ start: "lat,lng" }, { end: "lat,lng" }]
  if (Array.isArray(raw)) {
    const merged: Record<string, unknown> = {}
    for (const item of raw) {
      if (typeof item === 'object' && item !== null) Object.assign(merged, item)
    }
    const start = parseCoordString(merged.start)
    if (!start) return undefined
    const end = parseCoordString(merged.end) ?? undefined
    return { start, end }
  }
  return undefined
}

export function formatCoordPoint(pt: CoordPoint): string {
  const latDir = pt.lat >= 0 ? 'N' : 'S'
  const lngDir = pt.lng >= 0 ? 'E' : 'W'
  return `${Math.abs(pt.lat).toFixed(1)}° ${latDir}, ${Math.abs(pt.lng).toFixed(1)}° ${lngDir}`
}

export function mapUrl(coords: Coordinates): string {
  const { start, end } = coords
  if (end) {
    return `https://www.google.com/maps/dir/${start.lat},${start.lng}/${end.lat},${end.lng}`
  }
  return `https://www.google.com/maps?q=${start.lat},${start.lng}`
}

const postsDirectory = path.join(process.cwd(), 'content/posts')

export function getAllPosts(): Post[] {
  const fileNames = fs.readdirSync(postsDirectory)

  const posts = fileNames
    .filter((fn) => fn.endsWith('.md'))
    .map((fileName) => {
      const slug = fileName.replace(/\.md$/, '')
      const fullPath = path.join(postsDirectory, fileName)
      const fileContents = fs.readFileSync(fullPath, 'utf8')
      const { data } = matter(fileContents)

      return {
        slug,
        title: data.title as string,
        date: data.date as string,
        excerpt: data.excerpt as string,
        image: data.image as string,
        imageAlt: (data.imageAlt as string) ?? '',
        tags: (data.tags as Tag[]) ?? [],
        coordinates: parseCoordinates(data.coordinates),
      }
    })

  return posts.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )
}

export function getPostsByTag(tag: Tag): Post[] {
  return getAllPosts().filter((post) => post.tags.includes(tag))
}

export async function getPost(slug: string): Promise<Post | null> {
  try {
    const fullPath = path.join(postsDirectory, `${slug}.md`)
    const fileContents = fs.readFileSync(fullPath, 'utf8')
    const { data, content } = matter(fileContents)

    const processed = await remark()
      .use(remarkGfm)
      .use(remarkHtml, { sanitize: false, allowDangerousHtml: true })
      .process(content)

    return {
      slug,
      title: data.title as string,
      date: data.date as string,
      excerpt: data.excerpt as string,
      image: data.image as string,
      imageAlt: (data.imageAlt as string) ?? '',
      tags: (data.tags as Tag[]) ?? [],
      coordinates: parseCoordinates(data.coordinates),
      itinerary: (data.itinerary as ItineraryStop[] | undefined) ?? undefined,
      content: processed.toString(),
    }
  } catch {
    return null
  }
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
