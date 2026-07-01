import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const DEV_ONLY = process.env.NODE_ENV !== 'development'
  ? () => NextResponse.json({ error: 'Not found' }, { status: 404 })
  : null

const STORIES_DIR = join(process.cwd(), 'content/stories')

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const slug = req.nextUrl.searchParams.get('story')
  if (!slug || !/^[\w-]+$/.test(slug)) {
    return NextResponse.json({ error: 'Invalid story' }, { status: 400 })
  }

  const content = readFileSync(join(STORIES_DIR, `${slug}.yaml`), 'utf-8')
  const { load } = await import('js-yaml')
  const story = load(content) as Record<string, unknown>

  return NextResponse.json({ route: story.route ?? [] })
}

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { story: slug, route } = (await req.json()) as {
    story: string
    route: [number, number][]
  }

  if (!slug || !/^[\w-]+$/.test(slug) || !Array.isArray(route)) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const filePath = join(STORIES_DIR, `${slug}.yaml`)
  let content = readFileSync(filePath, 'utf-8')

  const newRouteYaml =
    'route:\n' + route.map((p) => `  - [${p[0]}, ${p[1]}]`).join('\n')

  // Replace the route block — find from 'route:' up to the next top-level key
  const routeStart = content.indexOf('\nroute:')
  const afterRoute = content.indexOf('\n\n', routeStart + 1)
  content =
    content.slice(0, routeStart + 1) +
    newRouteYaml +
    '\n' +
    (afterRoute !== -1 ? content.slice(afterRoute) : '')

  writeFileSync(filePath, content, 'utf-8')
  return NextResponse.json({ ok: true, count: route.length })
}
