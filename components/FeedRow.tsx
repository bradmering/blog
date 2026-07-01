import Link from 'next/link'
import Image from 'next/image'
import { formatDate } from '@/lib/posts'

interface FeedRowProps {
  href: string
  image?: string
  imageAlt?: string
  title: string
  description?: string
  date: string
  label: string  // e.g. "Adventures", "Story", "Topo"
}

export default function FeedRow({ href, image, imageAlt, title, description, date, label }: FeedRowProps) {
  return (
    <article className="flex gap-5 sm:gap-7 py-7 border-b border-stone-100 group">
      {/* Cover image */}
      <Link href={href} className="shrink-0 relative w-36 sm:w-48 overflow-hidden rounded-md bg-stone-100 self-start" style={{ aspectRatio: '3/2' }}>
        {image ? (
          <Image
            src={image}
            alt={imageAlt ?? title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 144px, 192px"
          />
        ) : (
          <div className="absolute inset-0 bg-stone-200" />
        )}
      </Link>

      {/* Text */}
      <div className="min-w-0 flex flex-col justify-center gap-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-stone-400">
            {label}
          </span>
          <span className="text-stone-200" aria-hidden>·</span>
          <time className="text-[10px] text-stone-400 font-medium uppercase tracking-wide">
            {formatDate(date)}
          </time>
        </div>
        <h3 className="text-base sm:text-lg font-semibold text-stone-900 leading-snug group-hover:text-stone-500 transition-colors">
          <Link href={href}>{title}</Link>
        </h3>
        {description && (
          <p className="text-sm text-stone-500 leading-relaxed line-clamp-2">{description}</p>
        )}
      </div>
    </article>
  )
}
