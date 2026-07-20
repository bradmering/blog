export type Align = 'left' | 'right'

export interface TitleChapter {
  id: string
  type: 'title'
  heading: string
  subheading?: string
  image?: string
  text?: string
  textHtml?: string
}

export interface SplashChapter {
  id: string
  type: 'splash'
  image: string
  heading?: string
  subheading?: string
}

export interface MapChapter {
  id: string
  type: 'map'
  heading: string
  subheading?: string
  text: string
  textHtml?: string
  coordinates: [number, number]
  zoom: number
  pitch?: number
  bearing?: number
  routeProgress?: number
  marker?: boolean
  align?: Align
}

export interface ImageChapter {
  id: string
  type: 'image'
  image: string
  caption?: string
}

export type GalleryLayout = 'single' | 'duo' | 'trio' | 'quad' | 'grid'

export interface GalleryImage {
  src: string
  caption?: string
}

export interface GalleryChapter {
  id: string
  type: 'gallery'
  layout: GalleryLayout
  images: GalleryImage[]
}

export interface ArticleMedia {
  type: 'image' | 'video'
  src: string
  caption?: string
  poster?: string
  loop?: boolean
}

export interface ArticleChapter {
  id: string
  type: 'article'
  heading: string
  subheading?: string
  text?: string
  textHtml?: string
  heroImage?: { src: string; caption?: string }
  coordinates: [number, number]
  zoom: number
  pitch?: number
  bearing?: number
  routeProgress?: number
  marker?: boolean
  align?: Align
  media?: ArticleMedia[]
}

export interface ImagePin {
  coordinates: [number, number]
  thumbnail: string
  image: string
  caption?: string
}

export interface VideoChapter {
  id: string
  type: 'video'
  src: string
  poster?: string
  caption?: string
  loop?: boolean
}

export interface ParallaxVideoChapter {
  id: string
  type: 'parallax-video'
  src: string
  poster?: string
  caption?: string
  loop?: boolean
  heading?: string
  subheading?: string
  text?: string
  textHtml?: string
  align?: Align
  /** 'full' (default): full-bleed video background with text overlaid on
   *  top, best for landscape clips. 'split': video pinned in its own
   *  narrower column (letterboxed, nothing cropped) with text scrolling
   *  in a plain column alongside it — better for portrait/phone video. */
  layout?: 'full' | 'split'
}

export interface OverviewChapter {
  id: string
  type: 'overview'
  heading?: string
  subheading?: string
  text?: string
  textHtml?: string
}

export interface LogisticsLink {
  label: string
  url: string
  note?: string
}

export interface PackingGroup {
  group: string
  items: string[]
}

export interface TopoQuad {
  name: string
  url: string
  year?: number
  scale?: string
  note?: string
}

export interface LogisticsChapter {
  id: string
  type: 'logistics'
  heading?: string
  subheading?: string
  text?: string
  textHtml?: string
  links?: LogisticsLink[]
  quads?: TopoQuad[]
  packing?: PackingGroup[]
}

export type Chapter =
  | TitleChapter
  | SplashChapter
  | MapChapter
  | ImageChapter
  | GalleryChapter
  | ArticleChapter
  | VideoChapter
  | ParallaxVideoChapter
  | OverviewChapter
  | LogisticsChapter

export interface Story {
  title: string
  subtitle?: string
  mapStyle?: string
  initialView: {
    coordinates: [number, number]
    zoom: number
    pitch?: number
    bearing?: number
  }
  route?: [number, number][]
  imagePins?: ImagePin[]
  chapters: Chapter[]
}
