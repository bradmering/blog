import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { remark } from 'remark'
import remarkGfm from 'remark-gfm'
import remarkHtml from 'remark-html'

export interface WorkProject {
  slug: string
  title: string
  year: string
  type: string
  url?: string
  image: string
  imageAlt: string
  tags: string[]
  excerpt: string
  content?: string
}

const workDirectory = path.join(process.cwd(), 'content/work')

export function getAllWork(): WorkProject[] {
  const fileNames = fs.readdirSync(workDirectory)
  return fileNames
    .filter((fn) => fn.endsWith('.md'))
    .map((fileName) => {
      const slug = fileName.replace(/\.md$/, '')
      const fullPath = path.join(workDirectory, fileName)
      const { data } = matter(fs.readFileSync(fullPath, 'utf8'))
      return {
        slug,
        title: data.title as string,
        year: data.year as string,
        type: data.type as string,
        url: data.url as string | undefined,
        image: data.image as string,
        imageAlt: (data.imageAlt as string) ?? '',
        tags: (data.tags as string[]) ?? [],
        excerpt: data.excerpt as string,
      }
    })
}

export async function getWork(slug: string): Promise<WorkProject | null> {
  try {
    const fullPath = path.join(workDirectory, `${slug}.md`)
    const { data, content } = matter(fs.readFileSync(fullPath, 'utf8'))
    const processed = await remark()
      .use(remarkGfm)
      .use(remarkHtml, { sanitize: false, allowDangerousHtml: true })
      .process(content)
    return {
      slug,
      title: data.title as string,
      year: data.year as string,
      type: data.type as string,
      url: data.url as string | undefined,
      image: data.image as string,
      imageAlt: (data.imageAlt as string) ?? '',
      tags: (data.tags as string[]) ?? [],
      excerpt: data.excerpt as string,
      content: processed.toString(),
    }
  } catch {
    return null
  }
}
