import { WorkProject } from '@/lib/work'
import Link from 'next/link'

export interface WorkItem {
  title: string
  description: string
  image: string
  tags: string[]
  url?: string
  slug?: string
  year: string
}

export default function WorkCard({ work }: { work: WorkProject }) {
  const href = work.slug ? `/work/${work.slug}` : work.url
  const isExternal = !work.slug && !!work.url

  const inner = (
    <>
      <div className="relative aspect-[16/9] bg-stone-100 overflow-hidden">
        <img
          src={work.image}
          alt={work.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between gap-4 mb-2">
          <h3 className="font-semibold text-stone-900 text-base leading-snug">
            {work.title}
          </h3>
          <span className="text-xs text-stone-400 font-medium shrink-0 mt-0.5">
            {work.year}
          </span>
        </div>
        <p className="text-sm text-stone-500 leading-relaxed mb-3">
          {work.excerpt ?? work.content?.slice(0, 100) + '...'}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {work.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs text-stone-500 bg-stone-100 px-2 py-0.5 rounded font-medium"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </>
  )

  const className =
    'group block border border-stone-200 rounded-xl overflow-hidden hover:border-stone-300 hover:shadow-sm transition-all'

  if (!href) return <div className={className}>{inner}</div>

  if (isExternal) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {inner}
      </a>
    )
  }

  return (
    <Link href={href} className={className}>
      {inner}
    </Link>
  )
}
