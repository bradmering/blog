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

export interface ArticleBlock {
  text?: string
  textHtml?: string
  image?: string
  caption?: string
  align?: 'left' | 'right' | 'full'
}

export interface ArticleChapter {
  id: string
  type: 'article'
  blocks: ArticleBlock[]
}

export interface VideoChapter {
  id: string
  type: 'video'
  src: string
  poster?: string
  caption?: string
  loop?: boolean
}

export type Chapter =
  | TitleChapter
  | SplashChapter
  | MapChapter
  | ImageChapter
  | GalleryChapter
  | ArticleChapter
  | VideoChapter

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
  chapters: Chapter[]
}
