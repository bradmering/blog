'use client'

import type { LogisticsChapter as LogisticsChapterType } from './types'
import Reveal from './Reveal'

function isDownload(url: string) {
  return url.startsWith('/') || url.endsWith('.gpx')
}

export default function LogisticsChapter({ chapter }: { chapter: LogisticsChapterType }) {
  return (
    <div className="relative z-10 bg-stone-900 text-stone-200 pointer-events-auto">
      <div className="max-w-4xl mx-auto px-6 sm:px-12 py-20 sm:py-28">
        <Reveal>
          {chapter.subheading && (
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500 mb-2">
              {chapter.subheading}
            </p>
          )}
          <h2 className="text-3xl font-bold text-white mb-5 tracking-tight">
            {chapter.heading ?? 'Logistics'}
          </h2>
          {chapter.textHtml ? (
            <div
              className="prose prose-invert prose-stone max-w-none mb-12"
              dangerouslySetInnerHTML={{ __html: chapter.textHtml }}
            />
          ) : (
            chapter.text && <p className="text-stone-400 leading-8 mb-12 max-w-2xl">{chapter.text}</p>
          )}
        </Reveal>

        {chapter.links && chapter.links.length > 0 && (
          <Reveal className="mb-16">
            <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500 mb-5">
              Maps &amp; resources
            </h3>
            <ul className="grid sm:grid-cols-2 gap-3">
              {chapter.links.map((link, i) => {
                const download = isDownload(link.url)
                return (
                  <li key={i}>
                    <a
                      href={link.url}
                      target={download ? undefined : '_blank'}
                      rel={download ? undefined : 'noopener noreferrer'}
                      download={download || undefined}
                      className="group flex items-start gap-3 rounded-lg border border-stone-700 hover:border-red-500 bg-stone-800/40 hover:bg-stone-800 p-4 transition-colors"
                    >
                      <span className="mt-0.5 text-red-500 shrink-0">
                        {download ? (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1v-8.5M15 3h6m0 0v6m0-6L10 14" />
                          </svg>
                        )}
                      </span>
                      <span>
                        <span className="block text-sm font-medium text-white group-hover:text-red-400 transition-colors">
                          {link.label}
                        </span>
                        {link.note && (
                          <span className="block text-xs text-stone-500 mt-0.5">{link.note}</span>
                        )}
                      </span>
                    </a>
                  </li>
                )
              })}
            </ul>
          </Reveal>
        )}

        {chapter.quads && chapter.quads.length > 0 && (
          <Reveal className="mb-16">
            <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500 mb-5">
              USGS topo quads
            </h3>
            <p className="text-xs text-stone-500 mb-4">In route order, headwaters to coast.</p>
            <ul className="divide-y divide-stone-800 border-t border-b border-stone-800">
              {chapter.quads.map((quad, i) => (
                <li key={i} className="flex items-center gap-4 py-3">
                  <a
                    href={quad.url}
                    download
                    className="group flex items-center gap-3 shrink-0 w-64 sm:w-72"
                  >
                    <span className="text-red-500 shrink-0">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16" />
                      </svg>
                    </span>
                    <span>
                      <span className="block text-sm font-medium text-white group-hover:text-red-400 transition-colors">
                        {quad.name}
                      </span>
                      {(quad.scale || quad.year) && (
                        <span className="block text-xs text-stone-500 mt-0.5">
                          {[quad.scale, quad.year].filter(Boolean).join(' · ')}
                        </span>
                      )}
                    </span>
                  </a>
                  <span className="text-sm text-stone-400 italic flex-1">
                    {quad.note || <span className="text-stone-600">—</span>}
                  </span>
                </li>
              ))}
            </ul>
          </Reveal>
        )}

        {chapter.packing && chapter.packing.length > 0 && (
          <Reveal>
            <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500 mb-5">
              Packing list
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-8">
              {chapter.packing.map((grp, i) => (
                <div key={i}>
                  <h4 className="text-sm font-semibold text-white mb-2.5">{grp.group}</h4>
                  <ul className="space-y-1.5">
                    {grp.items.map((item, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-stone-400">
                        <span className="mt-1.5 w-1 h-1 rounded-full bg-stone-600 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Reveal>
        )}
      </div>
    </div>
  )
}
