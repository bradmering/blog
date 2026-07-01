import Link from 'next/link'
import Image from 'next/image'
import type { Post } from '@/lib/posts'
import TagBadge from './TagBadge'
import { formatDate } from '@/lib/posts'

export default function PostCard({ post }: { post: Post }) {
  return (
    <Link href={`/blog/${post.slug}`} className="group block">
      <article>
        <div className="relative aspect-[16/10] overflow-hidden rounded-lg bg-stone-100 mb-4">
          <Image
            src={post.image}
            alt={post.imageAlt}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          {post.tags.map((tag) => (
            <TagBadge key={tag} tag={tag} />
          ))}
        </div>
        <h3 className="text-lg font-semibold text-stone-900 leading-snug mb-1.5 group-hover:text-stone-600 transition-colors">
          {post.title}
        </h3>
        <p className="text-sm text-stone-500 line-clamp-2 leading-relaxed mb-3">
          {post.excerpt}
        </p>
        <time className="text-xs text-stone-400 font-medium tracking-wide uppercase">
          {formatDate(post.date)}
        </time>
      </article>
    </Link>
  )
}
