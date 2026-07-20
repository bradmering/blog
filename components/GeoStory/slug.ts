import type { Chapter } from './types'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function chapterLabel(c: Chapter): string {
  if ('heading' in c && c.heading) return c.heading
  return c.id
}

/**
 * Maps each chapter's internal id to a readable, unique, kebab-case slug
 * derived from its heading — e.g. "day3-muskoxen" -> "the-battle" — so
 * chapters can be deep-linked as /stories/brooks-range#the-battle.
 */
export function buildChapterSlugs(chapters: Chapter[]): Record<string, string> {
  const used = new Set<string>()
  const map: Record<string, string> = {}
  for (const c of chapters) {
    const base = slugify(chapterLabel(c)) || c.id
    let slug = base
    let n = 2
    while (used.has(slug)) slug = `${base}-${n++}`
    used.add(slug)
    map[c.id] = slug
  }
  return map
}
