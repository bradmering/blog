import fs from 'fs'
import path from 'path'
import { load as yamlLoad } from 'js-yaml'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkHtml from 'remark-html'
import type { Story } from '@/components/GeoStory/types'
import type { TopoStory } from '@/components/TopoStory/types'
import type { TopoData } from '@/lib/topo'

const storiesDirectory = path.join(process.cwd(), 'content/stories')

async function renderMarkdown(text: string): Promise<string> {
  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkHtml, { sanitize: false })
    .process(text)
  return String(result)
}

export function getTopoData(slug: string): TopoData | null {
  try {
    const filePath = path.join(process.cwd(), 'content', 'topos', `${slug}.json`)
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as TopoData
  } catch {
    return null
  }
}

export async function getStory(slug: string): Promise<Story | TopoStory | null> {
  try {
    const fullPath = path.join(storiesDirectory, `${slug}.yaml`)
    const fileContents = fs.readFileSync(fullPath, 'utf8')
    const story = yamlLoad(fileContents) as Story

    // Process markdown in all text-bearing chapter fields
    for (const chapter of story.chapters) {
      if (chapter.type === 'title' && chapter.text) {
        chapter.textHtml = await renderMarkdown(chapter.text)
      }
      if (chapter.type === 'map' && chapter.text) {
        chapter.textHtml = await renderMarkdown(chapter.text)
      }
      if (chapter.type === 'article' && chapter.text) {
        chapter.textHtml = await renderMarkdown(chapter.text)
      }
      if (chapter.type === 'overview' && chapter.text) {
        chapter.textHtml = await renderMarkdown(chapter.text)
      }
      if (chapter.type === 'parallax-video' && chapter.text) {
        chapter.textHtml = await renderMarkdown(chapter.text)
      }
      if (chapter.type === 'logistics' && chapter.text) {
        chapter.textHtml = await renderMarkdown(chapter.text)
      }
    }

    return story
  } catch {
    return null
  }
}

export function getAllStorySlugs(): string[] {
  try {
    return fs
      .readdirSync(storiesDirectory)
      .filter((f) => f.endsWith('.yaml'))
      .map((f) => f.replace(/\.yaml$/, ''))
  } catch {
    return []
  }
}

export interface StoryMeta {
  slug: string
  title: string
  subtitle?: string
  image?: string
  date: string    // ISO string — file mtime used if no date field in YAML
  isTopoStory: boolean
}

function extractStoryImage(raw: Record<string, unknown>): string | undefined {
  const chapters = raw.chapters as Array<Record<string, unknown>> | undefined
  if (!chapters) return undefined
  for (const ch of chapters) {
    if (ch.image && typeof ch.image === 'string') return ch.image
    const imgs = ch.images as Array<{ src?: string }> | undefined
    if (imgs?.[0]?.src) return imgs[0].src
  }
  return undefined
}

export function getAllStories(): StoryMeta[] {
  try {
    return fs
      .readdirSync(storiesDirectory)
      .filter((f) => f.endsWith('.yaml'))
      .map((fileName) => {
        const slug = fileName.replace(/\.yaml$/, '')
        const fullPath = path.join(storiesDirectory, fileName)
        const raw = yamlLoad(fs.readFileSync(fullPath, 'utf8')) as Record<string, unknown>
        const stat = fs.statSync(fullPath)
        const isTopoStory = Array.isArray(raw.chapters)
          ? (raw.chapters as Array<Record<string, unknown>>).some(c => c.type === 'topo')
          : !!raw.topoSlug
        return {
          slug,
          title: (raw.title as string) ?? slug,
          subtitle: raw.subtitle as string | undefined,
          image: extractStoryImage(raw),
          date: (raw.date as string) ?? stat.mtime.toISOString(),
          isTopoStory,
        }
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  } catch {
    return []
  }
}
