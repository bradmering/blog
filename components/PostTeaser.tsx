import Link from 'next/link'
import Image from 'next/image'
import type { Post } from '@/lib/posts'
import { formatDate } from '@/lib/posts'

export default function PostTeaser({ post }: { post: Post }) {
  return (
    <Link href={`/blog/${post.slug}`} className="group flex gap-4 items-start">
      <div className="relative w-20 h-20 shrink-0 overflow-hidden rounded-md bg-stone-100">
        <Image
          src={post.image}
          alt={post.imageAlt}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="80px"
        />
      </div>
      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-stone-900 leading-snug mb-1 group-hover:text-stone-600 transition-colors line-clamp-2">
          {post.title}
        </h3>
        <time className="text-xs text-stone-400 font-medium">{formatDate(post.date)}</time>
      </div>
    </Link>
  )
}
