import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { dump as yamlDump } from 'js-yaml'

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug')
  if (!slug) return NextResponse.json({ error: 'slug required' }, { status: 400 })
  const safeSlug = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-')
  const filePath = path.join(process.cwd(), 'content', 'topos', `${safeSlug}.json`)
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
    return NextResponse.json({ success: true, data })
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { slug, data } = await req.json()

    if (!slug || !data) {
      return NextResponse.json({ error: 'slug and data are required' }, { status: 400 })
    }

    const safeSlug = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-')
    const topoDir = path.join(process.cwd(), 'content', 'topos')
    const imgDir  = path.join(process.cwd(), 'public', 'images', 'topos', safeSlug)

    fs.mkdirSync(topoDir, { recursive: true })

    // Extract any base64 images from features, write them to public/, replace with paths
    const features = await Promise.all(
      (data.features ?? []).map(async (f: Record<string, unknown>, i: number) => {
        const dataUrl = f.imageDataUrl as string | undefined
        if (!dataUrl) return f

        const ext = dataUrl.startsWith('data:image/png') ? 'png' : 'jpg'
        const filename = `${f.type}-${i}.${ext}`
        const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, '')

        fs.mkdirSync(imgDir, { recursive: true })
        fs.writeFileSync(path.join(imgDir, filename), Buffer.from(base64, 'base64'))

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { imageDataUrl, imageName, ...rest } = f
        return { ...rest, image: `/images/topos/${safeSlug}/${filename}` }
      })
    )

    // Handle background image
    let backgroundImage: string | undefined = data.backgroundImage
    if (data.backgroundDataUrl) {
      const bgExt = (data.backgroundDataUrl as string).startsWith('data:image/png') ? 'png' : 'jpg'
      const bgBase64 = (data.backgroundDataUrl as string).replace(/^data:image\/\w+;base64,/, '')
      fs.mkdirSync(imgDir, { recursive: true })
      fs.writeFileSync(path.join(imgDir, `background.${bgExt}`), Buffer.from(bgBase64, 'base64'))
      backgroundImage = `/images/topos/${safeSlug}/background.${bgExt}`
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { backgroundDataUrl, ...restData } = data
    const topoData = { ...restData, backgroundImage, features }
    const filePath = path.join(topoDir, `${safeSlug}.json`)
    fs.writeFileSync(filePath, JSON.stringify(topoData, null, 2))

    // Write a companion story YAML to content/stories/ (only if it doesn't exist yet)
    const storiesDir = path.join(process.cwd(), 'content', 'stories')
    const storyPath = path.join(storiesDir, `${safeSlug}.yaml`)
    if (!fs.existsSync(storyPath)) {
      const imageW = (data.image as { w: number; h: number } | null)?.w ?? 1200
      const imageH = (data.image as { w: number; h: number } | null)?.h ?? 1200
      const humanTitle = safeSlug
        .split('-')
        .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ')
      const storyYaml = yamlDump({
        title: humanTitle,
        topoSlug: safeSlug,
        chapters: [
          { id: 'title', type: 'title', heading: humanTitle },
          {
            id: 'topo-overview',
            type: 'topo',
            topoSlug: safeSlug,
            bounds: [[0, 0], [imageW, imageH]],
            bgOpacity: 1,
          },
        ],
      }, { lineWidth: 120 })
      fs.mkdirSync(storiesDir, { recursive: true })
      fs.writeFileSync(storyPath, storyYaml)
    }

    return NextResponse.json({ success: true, saved: `content/topos/${safeSlug}.json` })
  } catch (err) {
    console.error('[topo/save]', err)
    return NextResponse.json({ error: 'Save failed' }, { status: 500 })
  }
}
