import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import matter from 'gray-matter'

const POSTS_DIR = join(process.cwd(), 'content/posts')

function devOnly() {
  return process.env.NODE_ENV !== 'development'
    ? NextResponse.json({ error: 'Not found' }, { status: 404 })
    : null
}

export async function GET(req: NextRequest) {
  const guard = devOnly()
  if (guard) return guard

  const slug = req.nextUrl.searchParams.get('post')
  if (!slug || !/^[\w-]+$/.test(slug)) {
    return NextResponse.json({ error: 'Invalid post' }, { status: 400 })
  }

  const content = readFileSync(join(POSTS_DIR, `${slug}.md`), 'utf-8')
  const { data } = matter(content)

  return NextResponse.json({ stops: data.itinerary ?? [] })
}

export async function POST(req: NextRequest) {
  const guard = devOnly()
  if (guard) return guard

  const { post: slug, stops } = (await req.json()) as {
    post: string
    stops: unknown[]
  }

  if (!slug || !/^[\w-]+$/.test(slug) || !Array.isArray(stops)) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const filePath = join(POSTS_DIR, `${slug}.md`)
  const content = readFileSync(filePath, 'utf-8')
  const { data, content: body } = matter(content)

  data.itinerary = stops

  const { dump } = await import('js-yaml')
  const newFrontmatter = dump(data, { lineWidth: -1 })
  writeFileSync(filePath, `---\n${newFrontmatter}---\n${body}`, 'utf-8')

  return NextResponse.json({ ok: true, count: stops.length })
}
