'use client'

import { useRef, useEffect } from 'react'
import type { VideoChapter as VideoChapterType } from './types'

export default function VideoChapter({ chapter }: { chapter: VideoChapterType }) {
  const videoRef = useRef<HTMLVideoElement>(null)

  // Play when visible, pause when scrolled away
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {})
        } else {
          video.pause()
        }
      },
      { threshold: 0.25 }
    )

    observer.observe(video)
    return () => observer.disconnect()
  }, [])

  return (
    <div className="relative h-screen z-10 pointer-events-auto">
      <video
        ref={videoRef}
        src={chapter.src}
        poster={chapter.poster}
        loop={chapter.loop ?? true}
        muted
        playsInline
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/50 pointer-events-none" />
      {chapter.caption && (
        <p className="absolute bottom-10 left-0 right-0 text-center text-white/80 text-sm italic px-10 max-w-xl mx-auto drop-shadow">
          {chapter.caption}
        </p>
      )}
    </div>
  )
}
