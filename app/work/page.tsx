import { getAllWork } from '@/lib/work'
import { pageMetadata } from '@/lib/seo'
import { resume, isTodo } from '@/lib/resume'
import ProjectTimeline from '@/components/work/ProjectTimeline'

export const metadata = pageMetadata({
  title: 'Work — Bradley Mering',
  description:
    'Résumé and selected work: platform architecture, content systems, design-system tooling, and client case studies.',
  path: '/work',
})

/** Renders an unfilled placeholder loudly so it can't quietly ship. */
function Todo({ children }: { children: string }) {
  return (
    <span className="inline-flex items-center rounded bg-amber-100 px-1.5 py-0.5 text-amber-800 font-medium not-italic">
      {children}
    </span>
  )
}

function Field({ value }: { value?: string }) {
  if (!value) return null
  return isTodo(value) ? <Todo>{value}</Todo> : <>{value}</>
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[11px] font-bold tracking-[0.2em] uppercase text-stone-400 mb-8">
      {children}
    </h2>
  )
}

function IconEmail() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  )
}

function IconGitHub() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  )
}

function IconPin() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}

export default function WorkIndexPage() {
  const projects = getAllWork()

  return (
    <div className="max-w-5xl mx-auto px-6 pt-24 pb-24">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="max-w-2xl mb-20">
        <h1 className="text-4xl font-bold tracking-tight text-stone-900 mb-2">
          {resume.name}
        </h1>
        <p className="text-lg text-stone-500 mb-6">{resume.headline}</p>

        <div className="space-y-3 text-stone-600 leading-relaxed">
          {resume.summary.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-7 text-sm text-stone-500">
          {resume.location && (
            <span className="inline-flex items-center gap-1.5">
              <IconPin />
              {resume.location}
            </span>
          )}
          {resume.email && (
            <a
              href={`mailto:${resume.email}`}
              className="inline-flex items-center gap-1.5 hover:text-stone-900 transition-colors"
            >
              <IconEmail />
              {resume.email}
            </a>
          )}
          {resume.github && (
            <a
              href={resume.github}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 hover:text-stone-900 transition-colors"
            >
              <IconGitHub />
              GitHub
            </a>
          )}
        </div>
      </header>

      {/* ── Experience ─────────────────────────────────────────────────── */}
      <section className="mb-20">
        <SectionHeading>Experience</SectionHeading>

        <ol className="relative">
          {/* Spine */}
          <div
            className="absolute top-2 bottom-2 left-1.5 w-px bg-stone-200"
            aria-hidden="true"
          />

          {resume.roles.map((role, i) => (
            <li key={i} className="relative pl-10 pb-10 last:pb-0">
              <span
                className="absolute left-0 top-1.5 w-3 h-3 rounded-full bg-stone-900 ring-4 ring-white"
                aria-hidden="true"
              />

              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 mb-1">
                <h3 className="text-lg font-semibold text-stone-900">
                  <Field value={role.title} />
                  <span className="text-stone-400 font-normal"> · </span>
                  <Field value={role.company} />
                </h3>
                <p className="text-sm text-stone-400 tabular-nums shrink-0">
                  <Field value={role.start} />
                  <span aria-hidden="true">–</span>
                  <Field value={role.end} />
                </p>
              </div>

              {role.location && (
                <p className="text-sm text-stone-400 mb-2">{role.location}</p>
              )}

              {role.summary && (
                <p className="text-stone-600 leading-relaxed mb-3">
                  <Field value={role.summary} />
                </p>
              )}

              {role.highlights && role.highlights.length > 0 && (
                <ul className="space-y-1.5">
                  {role.highlights.map((h, j) => (
                    <li
                      key={j}
                      className="relative pl-5 text-stone-600 leading-relaxed before:absolute before:left-0 before:top-[0.6em] before:w-1.5 before:h-1.5 before:rounded-full before:bg-stone-300"
                    >
                      <Field value={h} />
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ol>
      </section>

      {/* ── Selected work ──────────────────────────────────────────────── */}
      <section className="mb-20">
        <SectionHeading>Selected work</SectionHeading>
        <ProjectTimeline projects={projects} />
      </section>

      {/* ── Education & skills ─────────────────────────────────────────── */}
      <section className="grid gap-12 md:grid-cols-[1fr_1.4fr] mb-16">
        <div>
          <SectionHeading>Education</SectionHeading>
          <ul className="space-y-5">
            {resume.education.map((ed, i) => (
              <li key={i}>
                <p className="font-semibold text-stone-900">
                  <Field value={ed.credential} />
                </p>
                <p className="text-sm text-stone-500">
                  <Field value={ed.school} />
                  {ed.year && <span className="text-stone-400"> · {ed.year}</span>}
                </p>
                {ed.detail && (
                  <p className="text-sm text-stone-400 mt-1 leading-relaxed">{ed.detail}</p>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <SectionHeading>Skills</SectionHeading>
          <dl className="space-y-4">
            {resume.skills.map((group) => (
              <div
                key={group.group}
                className="grid grid-cols-1 sm:grid-cols-[9rem_1fr] gap-x-4 gap-y-1"
              >
                <dt className="text-sm font-semibold text-stone-900">{group.group}</dt>
                <dd className="flex flex-wrap gap-1.5">
                  {group.items.map((item) => (
                    <span
                      key={item}
                      className="text-[11px] text-stone-500 bg-stone-100 px-2 py-0.5 rounded font-medium"
                    >
                      {item}
                    </span>
                  ))}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ── Publications ───────────────────────────────────────────────── */}
      {resume.publications.length > 0 && (
        <section>
          <SectionHeading>Publications</SectionHeading>
          <ul className="space-y-3">
            {resume.publications.map((pub, i) => (
              <li key={i} className="text-stone-600 leading-relaxed">
                {pub.url ? (
                  <a
                    href={pub.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-stone-900 underline underline-offset-2 decoration-stone-300 transition-colors"
                  >
                    {pub.citation}
                  </a>
                ) : (
                  pub.citation
                )}{' '}
                <span className="text-stone-400 italic">{pub.venue}</span>
                <span className="text-stone-400">, {pub.year}.</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
