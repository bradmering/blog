'use client'

import { useRef, useEffect } from 'react'
import type { TitleChapter as TitleChapterType } from './types'

export default function TitleChapter({
  chapter,
  jumpLinks = [],
}: {
  chapter: TitleChapterType
  jumpLinks?: { label: string; href: string }[]
}) {
  const imgRef = useRef<HTMLImageElement>(null)

  // Parallax the hero image as user scrolls into the text panel
  useEffect(() => {
    const handleScroll = () => {
      if (imgRef.current) {
        imgRef.current.style.transform = `translateY(${window.scrollY * 0.38}px)`
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const paragraphs = chapter.textHtml
    ? (chapter.textHtml.match(/<p[\s\S]*?<\/p>/g) ?? [])
    : (chapter.text?.split(/\n\n+/).filter(Boolean) ?? [])

  return (
    <>
      {/* ── Part 1: Hero image ──────────────────────────────────────── */}
      <div className="relative h-[calc(100vh-3.5rem)] overflow-hidden z-10 pointer-events-auto">
        {chapter.image ? (
          <img
            ref={imgRef}
            src={chapter.image}
            alt=""
            className="absolute inset-0 w-full object-cover will-change-transform"
            style={{ height: '130%', top: '-15%' }}
          />
        ) : (
          <div className="absolute inset-0 bg-stone-900" />
        )}
        {/* Bottom gradient so title stays legible */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" />
        {/* Title anchored to bottom-left */}
        <div className="absolute bottom-12 left-10 right-10 max-w-3xl">
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-white leading-tight tracking-tight">
            {chapter.heading}
          </h1>
          {chapter.subheading && (
            <p className="mt-3 text-lg sm:text-xl text-white/65 font-light">
              {chapter.subheading}
            </p>
          )}
          {jumpLinks.length > 0 && (
            <div className="mt-6 flex flex-wrap items-center gap-x-7 gap-y-3">
              {jumpLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="group inline-flex items-center gap-2 text-sm font-medium text-white/80 hover:text-white transition-colors"
                >
                  <span className="border-b border-white/30 group-hover:border-white/70 pb-0.5 transition-colors">
                    {link.label}
                  </span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Part 2: Dark text panel ──────────────────────────────────── */}
      {paragraphs.length > 0 && (
        <div className="relative z-10 bg-black pointer-events-auto">
          <div className="max-w-4xl mx-auto px-8 sm:px-14 pt-16 pb-32">
            {chapter.textHtml
              ? paragraphs.map((html, i) => (
                  <div
                    key={i}
                    className={`text-stone-200 text-xl sm:text-xl leading-[1.85] ${i > 0 ? 'mt-10' : ''}`}
                    dangerouslySetInnerHTML={{ __html: html }}
                  />
                ))
              : paragraphs.map((text, i) => (
                  <p
                    key={i}
                    className={`text-stone-200 text-xl sm:text-xl leading-[1.85] ${i > 0 ? 'mt-10' : ''}`}
                  >
                    {text}
                  </p>
                ))
            }
          </div>
        </div>
      )}
    </>
  )
}
