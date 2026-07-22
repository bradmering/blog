import Link from 'next/link'
import type { WorkProject } from '@/lib/work'
import Reveal from '@/components/GeoStory/Reveal'

/**
 * Year strings in the content are freeform ("2025", "2022–present",
 * "2012 (v1) 2026 (v2)", "2007-2016"). Sort on the latest year mentioned so
 * ongoing work floats to the top, treating "present" as this year.
 */
function latestYear(year: string): number {
  if (/present|ongoing|current/i.test(year)) return new Date().getFullYear()
  const years = year.match(/\d{4}/g)
  if (!years) return 0
  return Math.max(...years.map(Number))
}

/** The short label that sits on the spine. */
function spineLabel(year: string): string {
  const years = year.match(/\d{4}/g)
  if (!years) return year
  if (/present|ongoing|current/i.test(year)) return `${years[0]}–`
  return years.length > 1 ? `${years[0]}–${years[years.length - 1]}` : years[0]
}

export default function ProjectTimeline({ projects }: { projects: WorkProject[] }) {
  const ordered = [...projects].sort((a, b) => latestYear(b.year) - latestYear(a.year))

  return (
    <div className="relative">
      {/* The spine: hugs the left edge on mobile, centers on desktop. */}
      <div
        className="absolute top-2 bottom-2 w-px bg-gradient-to-b from-stone-200 via-stone-200 to-transparent left-4 md:left-1/2 md:-translate-x-1/2"
        aria-hidden="true"
      />

      <ol className="space-y-10 md:space-y-4">
        {ordered.map((project, i) => {
          const onLeft = i % 2 === 0
          return (
            <li key={project.slug} className="relative">
              {/* Node on the spine */}
              <span
                className="absolute top-6 z-10 w-3 h-3 rounded-full bg-red-600 ring-4 ring-white left-4 md:left-1/2 -translate-x-1/2"
                aria-hidden="true"
              />

              {/* Year, opposite the card on desktop; inline in the card on mobile */}
              <span
                className={`hidden md:block absolute top-5 text-sm font-semibold tabular-nums text-stone-300 ${
                  onLeft ? 'left-1/2 pl-10' : 'right-1/2 pr-10 text-right'
                }`}
                aria-hidden="true"
              >
                {spineLabel(project.year)}
              </span>

              <Reveal
                offset={16}
                className={`pl-12 md:pl-0 ${
                  onLeft ? 'md:pr-[calc(50%+2.5rem)]' : 'md:pl-[calc(50%+2.5rem)]'
                }`}
              >
                <Link
                  href={`/work/${project.slug}`}
                  className="group block rounded-xl ring-1 ring-stone-100 hover:ring-stone-200 bg-white overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-stone-200/50 hover:-translate-y-0.5"
                >
                  <div className="aspect-[16/9] overflow-hidden bg-stone-100">
                    <img
                      src={project.image}
                      alt={project.imageAlt}
                      className="w-full h-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.04]"
                    />
                  </div>

                  <div className="p-5">
                    <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-stone-400 mb-1.5">
                      {project.type}
                      <span className="md:hidden"> · {project.year}</span>
                    </p>
                    <h3 className="text-lg font-semibold text-stone-900 group-hover:text-red-700 transition-colors mb-1.5 leading-snug">
                      {project.title}
                    </h3>
                    <p className="text-sm text-stone-500 leading-relaxed line-clamp-3">
                      {project.excerpt}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-3.5">
                      {project.tags.slice(0, 5).map((tag) => (
                        <span
                          key={tag}
                          className="text-[11px] text-stone-500 bg-stone-100 px-2 py-0.5 rounded font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </Link>
              </Reveal>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
