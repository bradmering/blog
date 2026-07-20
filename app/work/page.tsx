import Link from 'next/link'
import { getAllWork } from '@/lib/work'
import { pageMetadata } from '@/lib/seo'

export const metadata = pageMetadata({
  title: 'Work — Bradley Mering',
  description: 'Selected projects and case studies.',
  path: '/work',
})

export default function WorkIndexPage() {
  const projects = getAllWork()

  return (
    <div className="max-w-5xl mx-auto px-6 pt-28 pb-16">
      <h1 className="text-3xl font-bold tracking-tight text-stone-900 mb-2">Work</h1>
      <p className="text-stone-400 mb-12">Selected projects</p>

      <div className="divide-y divide-stone-100">
        {projects.map((project) => (
          <Link
            key={project.slug}
            href={`/work/${project.slug}`}
            className="group flex gap-6 py-8 items-start hover:bg-stone-50 -mx-4 px-4 rounded-lg transition-colors"
          >
            <div className="w-32 h-20 shrink-0 rounded-md overflow-hidden bg-stone-100">
              <img
                src={project.image}
                alt={project.imageAlt}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold tracking-widest uppercase text-stone-400 mb-1">
                {project.type} · {project.year}
              </p>
              <h2 className="text-lg font-semibold text-stone-900 group-hover:text-red-700 transition-colors mb-1">
                {project.title}
              </h2>
              <p className="text-sm text-stone-500 line-clamp-2 leading-relaxed">
                {project.excerpt}
              </p>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs text-stone-400 bg-stone-100 px-2 py-0.5 rounded font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
