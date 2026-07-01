'use client'

import { useEffect } from 'react'

export interface LightboxImage {
  src: string
  caption?: string
}

interface Props {
  images: LightboxImage[]
  index: number
  onClose: () => void
  onNav: (index: number) => void
}

export default function Lightbox({ images, index, onClose, onNav }: Props) {
  const image = images[index]

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft' && index > 0) onNav(index - 1)
      if (e.key === 'ArrowRight' && index < images.length - 1) onNav(index + 1)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [index, images.length, onClose, onNav])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/92 flex items-center justify-center"
      onClick={onClose}
    >
      <button
        className="absolute top-5 right-5 text-white/60 hover:text-white transition-colors"
        onClick={onClose}
        aria-label="Close"
      >
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {index > 0 && (
        <button
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors p-3"
          onClick={(e) => { e.stopPropagation(); onNav(index - 1) }}
          aria-label="Previous"
        >
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {index < images.length - 1 && (
        <button
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors p-3"
          onClick={(e) => { e.stopPropagation(); onNav(index + 1) }}
          aria-label="Next"
        >
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      <div
        className="flex flex-col items-center gap-4 max-w-[88vw] max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={image.src}
          alt={image.caption ?? ''}
          className="max-w-full max-h-[82vh] object-contain"
        />
        <div className="flex items-center gap-6">
          {image.caption && (
            <p className="text-white/65 text-sm italic">{image.caption}</p>
          )}
          {images.length > 1 && (
            <span className="text-white/35 text-xs tabular-nums shrink-0">{index + 1} / {images.length}</span>
          )}
        </div>
      </div>
    </div>
  )
}
