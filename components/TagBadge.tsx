import type { Tag } from '@/lib/posts'

const styles: Record<Tag, string> = {
  adventures: 'bg-amber-50 text-amber-700 ring-amber-200',
  reflections: 'bg-violet-50 text-violet-700 ring-violet-200',
  projects: 'bg-sky-50 text-sky-700 ring-sky-200',
  development: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  plans: 'bg-purple-50 text-purple-700 ring-purple-200',
  packrafting: 'bg-green-50 text-green-700 ring-green-200',
  alaska: 'bg-blue-50 text-blue-700 ring-blue-200',
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
