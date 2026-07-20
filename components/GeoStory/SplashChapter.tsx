'use client'

import { useRef, useEffect, useState } from 'react'
import type { SplashChapter as SplashChapterType } from './types'

const NAV_H = 56

export default function SplashChapter({ chapter }: { chapter: SplashChapterType }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [lift, setLift] = useState(0)

  useEffect(() => {
    const onScroll = () => {
      const el = containerRef.current
      if (!el) return
      const viewH = window.innerHeight - NAV_H
      const top = el.getBoundingClientRect().top - NAV_H
      // lift 0→1 as the container's second viewport scrolls past
      const progress = Math.max(0, Math.min(1, (-top - viewH) / viewH))
      setLift(progress)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div ref={containerRef} style={{ height: '200vh' }} className="pointer-events-auto">
      <div
        className="sticky overflow-hidden"
        style={{ top: NAV_H, height: `calc(100vh - ${NAV_H}px)`, zIndex: 15 }}
      >
        <img
          src={chapter.image}
          alt={chapter.heading ?? ''}
          className="w-full h-full object-cover"
          style={{ transform: `translateY(-${lift * 100}%)`, willChange: 'transform' }}
        />

        {/* Bottom gradient for legibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/65 pointer-events-none" />

        {(chapter.heading || chapter.subheading) && (
          <div className="absolute bottom-0 left-0 right-0 px-8 pb-16 text-center pointer-events-none">
            {chapter.heading && (
              <h1 className="text-white text-5xl sm:text-6xl font-bold leading-tight tracking-tight drop-shadow-2xl">
                {chapter.heading}
              </h1>
            )}
            {chapter.subheading && (
              <p className="mt-3 text-white/80 text-lg sm:text-xl font-light drop-shadow">
                {chapter.subheading}
              </p>
            )}
            <div className="mt-10 flex flex-col items-center gap-1.5 text-white/50">
              <span className="text-xs tracking-[0.2em] uppercase">Scroll</span>
              <svg className="w-4 h-4 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
