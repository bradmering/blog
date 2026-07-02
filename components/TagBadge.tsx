import type { Tag } from '@/lib/posts'

const styles: Record<Tag, string> = {
  adventures: 'bg-amber-50 text-amber-700 ring-amber-200',
  reflections: 'bg-violet-50 text-violet-700 ring-violet-200',
  projects: 'bg-sky-50 text-sky-700 ring-sky-200',
}

export default function TagBadge({ tag }: { tag: Tag }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium tracking-wide uppercase ring-1 ${styles[tag]}`}
    >
      {tag}
    </span>
  )
}
