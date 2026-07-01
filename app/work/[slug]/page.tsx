import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getAllWork, getWork } from '@/lib/work'

export async function generateStaticParams() {
  const projects = getAllWork()
  return projects.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const project = await getWork(slug)
  if (!project) return {}
  return {
    title: `${project.title} — Bradley Mering`,
    description: project.excerpt,
  }
}

export default async function WorkPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const project = await getWork(slug)
  if (!project) notFound()

  return (
    <div>
      {/* Hero */}
      <div className="relative w-full h-[55vh] min-h-[380px] bg-stone-100">
        <img
          src={project.image}
          alt={project.imageAlt}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/70" />

        <div className="absolute top-6 left-0 right-0 max-w-5xl mx-auto px-6">
          <Link
            href="/about"
            className="inline-flex items-center gap-1.5 text-white/80 hover:text-white text-sm transition-colors"
          >
            ← About
          </Link>
        </div>

        <div className="absolute bottom-0 left-0 right-0 max-w-5xl mx-auto px-6 pb-10">
          <p className="text-xs font-semibold tracking-widest uppercase text-white/60 mb-3">
            {project.type} · {project.year}
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight tracking-tight">
            {project.title}
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6">
        <div className="max-w-2xl mx-auto py-12">
          {/* Meta bar */}
          <div className="flex items-center justify-between gap-4 mb-8 pb-8 border-b border-stone-100">
            <div className="flex flex-wrap gap-1.5">
              {project.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs text-stone-500 bg-stone-100 px-2 py-0.5 rounded font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
            {project.url && (
              <a
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-stone-500 hover:text-stone-900 transition-colors shrink-0"
              >
                Visit site ↗
              </a>
            )}
          </div>

          <p className="text-xl text-stone-600 leading-relaxed mb-8 font-medium">
            {project.excerpt}
          </p>

          <div
            className="prose prose-stone max-w-none"
            dangerouslySetInnerHTML={{ __html: project.content ?? '' }}
          />
        </div>
      </div>
    </div>
  )
}
