'use client'

import { useRef, useEffect } from 'react'
import type { ParallaxVideoChapter as ParallaxVideoChapterType } from './types'

const NAV_H = 56

// Scroll budget: text scrolls past over the first zone, the video then
// holds on its own for a beat, then releases and scrolls off with the rest
// of the page. Cut 20% off the base 300vh for a tighter pace.
const TEXT_VH = 80
const HOLD_VH = 80
const RELEASE_VH = 80
const TOTAL_VH = TEXT_VH + HOLD_VH + RELEASE_VH

function useAutoplay() {
  const videoRef = useRef<HTMLVideoElement>(null)
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) video.play().catch(() => {})
        else video.pause()
      },
      { threshold: 0.1 }
    )
    observer.observe(video)
    return () => observer.disconnect()
  }, [])
  return videoRef
}

function ScrollCue() {
  return (
    <div className="absolute bottom-5 left-0 right-0 flex flex-col items-center gap-1.5 text-white/50 pointer-events-none">
      <span className="text-[10px] tracking-[0.2em] uppercase">Scroll</span>
      <svg className="w-4 h-4 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  )
}

/**
 * Text block. `responsive` mode renders as a frosted glass card on mobile
 * (readable over a full-bleed video) and switches to plain dark-on-white
 * text once the sm: split layout kicks in and text no longer overlaps video.
 */
function TextContent({
  chapter,
  variant,
}: {
  chapter: ParallaxVideoChapterType
  variant: 'glass' | 'responsive'
}) {
  const dual = variant === 'responsive'
  return (
    <>
      {chapter.subheading && (
        <p
          className={`text-[10px] font-bold uppercase tracking-[0.18em] mb-2 ${
            dual ? 'text-white/70 sm:text-stone-400' : 'text-white/70'
          }`}
        >
          {chapter.subheading}
        </p>
      )}
      {chapter.heading && (
        <h2
          className={`text-3xl sm:text-4xl font-bold mb-4 leading-tight tracking-tight ${
            dual ? 'text-white drop-shadow-sm sm:drop-shadow-none' : 'text-white drop-shadow-sm'
          }`}
        >
          {chapter.heading}
        </h2>
      )}
      {chapter.textHtml ? (
        <div
          className={
            dual
              ? 'prose prose-invert prose-sm sm:prose-base max-w-none prose-p:text-white prose-p:leading-7 prose-strong:text-white '
              : 'prose prose-invert prose-sm sm:prose-base max-w-none prose-p:text-white prose-p:leading-7 prose-strong:text-white'
          }
          dangerouslySetInnerHTML={{ __html: chapter.textHtml }}
        />
      ) : (
        chapter.text?.split('\n\n').map((p, i) => (
          <p
            key={i}
            className={`mb-3 leading-7 text-sm sm:text-base last:mb-0 ${
              dual ? 'text-white sm:text-stone-700' : 'text-white'
            }`}
          >
            {p}
          </p>
        ))
      )}
    </>
  )
}

export default function ParallaxVideoChapter({ chapter }: { chapter: ParallaxVideoChapterType }) {
  const videoRef = useAutoplay()
  const isLeft = chapter.align !== 'right'
  const hasText = chapter.heading || chapter.subheading || chapter.text || chapter.textHtml

  if (chapter.layout === 'split') {
    return (
      <div className="relative pointer-events-auto bg-black" style={{ height: `${TOTAL_VH}vh` }}>
        {/* Pinned frame: full-bleed on mobile, video pinned to its own
            letterboxed column from sm: up so portrait/phone clips never
            get cropped. */}
        <div
          className={`sticky flex ${isLeft ? '' : 'sm:flex-row-reverse'}`}
          style={{ top: NAV_H, height: `calc(100vh - ${NAV_H}px)`, zIndex: 15 }}
        >
          <div className="w-full sm:w-[46%] h-full relative overflow-hidden bg-black shrink-0">
            <video
              ref={videoRef}
              src={chapter.src}
              poster={chapter.poster}
              loop={chapter.loop ?? true}
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover sm:object-contain"
            />
            {/* Darken for the mobile glass-text pass only */}
            <div
              className={`absolute inset-0 pointer-events-none sm:hidden ${
                isLeft
                  ? 'bg-gradient-to-r from-black/70 via-black/10 to-transparent'
                  : 'bg-gradient-to-l from-black/70 via-black/10 to-transparent'
              }`}
            />
            {chapter.caption && (
              <p className="absolute bottom-6 sm:bottom-4 left-6 sm:left-4 right-6 sm:right-4 text-white/60 text-xs italic pointer-events-none">
                {chapter.caption}
              </p>
            )}
            <ScrollCue />
          </div>
          <div className="hidden sm:block flex-1 h-full" />
        </div>

        {/* Text — normal document flow within the tall container, so it
            scrolls at page speed while the video column stays pinned. */}
        {hasText && (
          <div
            className={`absolute top-0 left-0 right-0 flex items-center px-6 sm:px-16 ${
              isLeft ? 'justify-start sm:justify-end' : 'justify-end sm:justify-start'
            }`}
            style={{ height: `${TEXT_VH}vh`, zIndex: 20 }}
          >
            <div
              className={`max-w-md pointer-events-none bg-white/65 backdrop-blur-md ring-1 ring-white/10 rounded-2xl shadow-2xl shadow-black/40 px-6 py-6 sm:bg-transparent sm:backdrop-blur-none sm:ring-0 sm:rounded-none sm:shadow-none sm:px-0 sm:py-0 ${
                isLeft ? 'sm:mr-[8%]' : 'sm:ml-[8%]'
              }`}
            >
              <TextContent chapter={chapter} variant="responsive" />
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="relative pointer-events-auto" style={{ height: `${TOTAL_VH}vh` }}>
      {/* Pinned video background */}
      <div
        className="sticky overflow-hidden bg-black"
        style={{ top: NAV_H, height: `calc(100vh - ${NAV_H}px)`, zIndex: 15 }}
      >
        <video
          ref={videoRef}
          src={chapter.src}
          poster={chapter.poster}
          loop={chapter.loop ?? true}
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div
          className={`absolute inset-0 pointer-events-none ${
            isLeft
              ? 'bg-gradient-to-r from-black/70 via-black/10 to-transparent'
              : 'bg-gradient-to-l from-black/70 via-black/10 to-transparent'
          }`}
        />
        {chapter.caption && (
          <p
            className={`absolute bottom-6 ${isLeft ? 'right-6 text-right' : 'left-6 text-left'} max-w-xs text-white/60 text-xs italic drop-shadow pointer-events-none`}
          >
            {chapter.caption}
          </p>
        )}

        <ScrollCue />
      </div>

      {/* Text overlay — normal document flow within the tall container, so it
          scrolls at page speed while the video behind it stays pinned. */}
      {hasText && (
        <div
          className={`absolute top-0 left-0 right-0 flex items-center px-6 sm:px-16 ${
            isLeft ? 'justify-start' : 'justify-end'
          }`}
          style={{ height: `${TEXT_VH}vh`, zIndex: 20 }}
        >
          <div className="max-w-md pointer-events-none bg-black/65 backdrop-blur-md ring-1 ring-white/10 rounded-2xl px-6 py-6 sm:px-8 sm:py-7 shadow-2xl shadow-black/40">
            <TextContent chapter={chapter} variant="glass" />
          </div>
        </div>
      )}
    </div>
  )
}
