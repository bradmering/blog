'use client'

import { useState, useRef, useEffect } from 'react'
import type { Chapter } from './types'

function chapterLabel(c: Chapter): string {
  switch (c.type) {
    case 'title':
      return c.heading
    case 'article':
      return c.heading
    case 'overview':
      return c.heading ?? 'Overview'
    case 'logistics':
      return c.heading ?? 'Logistics'
    case 'parallax-video':
      return c.heading ?? 'Video'
    case 'map':
      return c.heading
    case 'splash':
      return c.heading ?? 'Intro'
    case 'video':
      return c.caption ?? 'Video'
    case 'gallery':
      return 'Gallery'
    case 'image':
      return c.caption ?? 'Image'
    default:
      return 'Chapter'
  }
}

function chapterSubLabel(c: Chapter): string | undefined {
  if ('subheading' in c) return c.subheading
  return undefined
}

export default function ChapterNav({ chapters, activeIdx }: { chapters: Chapter[]; activeIdx: number }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const active = chapters[activeIdx]

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const jumpTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setOpen(false)
  }

  if (!active) return null

  return (
    <div ref={rootRef} className="fixed bottom-0 left-0 right-0 z-40 pointer-events-auto">
      {open && (
        <div className="absolute bottom-full left-0 right-0 max-h-[60vh] overflow-y-auto bg-stone-900/95 backdrop-blur-md border-t border-stone-800">
          <ul className="max-w-2xl mx-auto py-2">
            {chapters.map((c, i) => {
              const sub = chapterSubLabel(c)
              return (
                <li key={c.id}>
                  <button
                    onClick={() => jumpTo(c.id)}
                    className={`w-full flex items-center gap-3 px-6 py-2.5 text-left transition-colors ${
                      i === activeIdx ? 'bg-stone-800/70' : 'hover:bg-stone-800/40'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        i === activeIdx ? 'bg-red-500' : 'bg-stone-600'
                      }`}
                    />
                    <span className="flex-1 min-w-0">
                      <span
                        className={`block text-sm truncate ${
                          i === activeIdx ? 'text-white font-medium' : 'text-stone-300'
                        }`}
                      >
                        {chapterLabel(c)}
                      </span>
                      {sub && (
                        <span className="block text-[10px] uppercase tracking-[0.14em] text-stone-500 mt-0.5 truncate">
                          {sub}
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-3 px-4 sm:px-6 py-3 bg-stone-900/90 backdrop-blur-md border-t border-stone-800"
      >
        <span className="flex items-center gap-3 min-w-0">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
          <span className="text-[10px] uppercase tracking-[0.14em] text-stone-500 shrink-0">
            {activeIdx + 1} / {chapters.length}
          </span>
          <span className="text-sm text-white font-medium truncate">{chapterLabel(active)}</span>
        </span>
        <svg
          className={`w-4 h-4 text-stone-400 shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      </button>
    </div>
  )
}
