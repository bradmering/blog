'use client'

import { useRef, useEffect, useMemo, useState } from 'react'
import type { ArticleChapter as ArticleChapterType, ArticleMedia } from './types'
import { formatCoords } from './coords'
import Lightbox from './Lightbox'
import Reveal from './Reveal'

function FullWidthVideo({ media }: { media: ArticleMedia }) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) video.play().catch(() => {})
        else video.pause()
      },
      { threshold: 0.4 }
    )
    observer.observe(video)
    return () => observer.disconnect()
  }, [])

  return (
    <figure className="relative w-full bg-black">
      <video
        ref={videoRef}
        src={media.src}
        poster={media.poster}
        loop={media.loop ?? true}
        muted
        playsInline
        controls
        className="w-full h-auto max-h-[90vh] object-contain mx-auto"
      />
      {media.caption && (
        <figcaption className="absolute bottom-4 left-0 right-0 text-center text-white/70 text-sm italic px-6 pointer-events-none drop-shadow">
          {media.caption}
        </figcaption>
      )}
    </figure>
  )
}

export default function ArticleChapter({ chapter }: { chapter: ArticleChapterType }) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)
  const isLeft = chapter.align !== 'right'
  const coords = chapter.coordinates ? formatCoords(chapter.coordinates) : null

  const mediaImages = useMemo(
    () => (chapter.media ?? []).filter((m) => m.type === 'image'),
    [chapter.media]
  )
  const mediaVideos = useMemo(
    () => (chapter.media ?? []).filter((m) => m.type === 'video'),
    [chapter.media]
  )

  // Lightbox covers the hero image + any media images (not videos), in display order
  const lightboxImages = useMemo(() => {
    const imgs: { src: string; caption?: string }[] = []
    if (chapter.heroImage) imgs.push(chapter.heroImage)
    for (const m of mediaImages) imgs.push({ src: m.src, caption: m.caption })
    return imgs
  }, [chapter.heroImage, mediaImages])

  const mediaImageOffset = chapter.heroImage ? 1 : 0

  return (
    <div className="relative z-10 bg-white pointer-events-auto">

      <div className={`flex flex-col md:flex-row md:min-h-[85vh] ${isLeft ? '' : 'md:flex-row-reverse'}`}>
        {chapter.heroImage && (
          <div className="md:w-[46%] w-full flex-shrink-0 relative overflow-hidden group">
            <img
              src={chapter.heroImage.src}
              alt={chapter.heroImage.caption ?? ''}
              className="block w-full h-64 sm:h-96 md:h-full object-cover cursor-zoom-in transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]"
              onClick={() => setLightboxIdx(0)}
            />
            {chapter.heroImage.caption && (
              <p className="md:absolute md:bottom-0 md:left-0 md:right-0 mt-1.5 md:mt-0 px-4 py-2 md:py-3 text-stone-400 md:text-white/85 text-xs italic md:bg-gradient-to-t md:from-black/60 md:to-transparent pointer-events-none">
                {chapter.heroImage.caption}
              </p>
            )}
          </div>
        )}

        <div className="flex-1 flex items-center px-6 sm:px-12 py-14 sm:py-20">
          <Reveal className="max-w-xl mx-auto md:mx-0">
            {(chapter.subheading || coords) && (
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-3">
                {chapter.subheading && (
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-400">
                    {chapter.subheading}
                  </p>
                )}
                {coords && (
                  <p className="text-[10px] font-medium tracking-wide text-stone-300 tabular-nums">
                    {coords}
                  </p>
                )}
              </div>
            )}
            <h2 className="text-2xl font-bold text-stone-900 mb-4 leading-snug tracking-tight">
              {chapter.heading}
            </h2>
            {chapter.textHtml ? (
              <div
                className="prose prose-stone max-w-none"
                dangerouslySetInnerHTML={{ __html: chapter.textHtml }}
              />
            ) : (
              chapter.text?.split('\n\n').map((p, i) => (
                <p key={i} className="mb-4 text-stone-700 leading-8 text-[1.02rem] last:mb-0">
                  {p}
                </p>
              ))
            )}
          </Reveal>
        </div>
      </div>

      {mediaImages.length > 0 && (
        <div className="flex flex-wrap gap-2 justify-center items-center px-4 sm:px-8 py-8 bg-stone-50">
          {mediaImages.map((m, i) => (
            <Reveal key={i} delay={i * 60} offset={16}>
              <img
                src={m.src}
                alt={m.caption ?? ''}
                className="h-64 sm:h-80 w-auto max-w-full rounded-sm shadow-sm cursor-zoom-in transition-transform duration-500 ease-out hover:scale-[1.02]"
                onClick={() => setLightboxIdx(mediaImageOffset + i)}
              />
            </Reveal>
          ))}
        </div>
      )}

      {/* Full-width day videos, in the scroll */}
      {mediaVideos.map((m, i) => (
        <FullWidthVideo key={i} media={m} />
      ))}

      {lightboxIdx !== null && (
        <Lightbox
          images={lightboxImages}
          index={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
          onNav={setLightboxIdx}
        />
      )}
    </div>
  )
}
