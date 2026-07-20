'use client'

import { useState } from 'react'
import type { GalleryChapter as GalleryChapterType, GalleryImage } from './types'
import Lightbox from './Lightbox'

function Caption({ text }: { text?: string }) {
  if (!text) return null
  return (
    <p className="absolute bottom-4 left-0 right-0 text-center text-white/80 text-xs italic px-6 pointer-events-none drop-shadow">
      {text}
    </p>
  )
}

function Img({
  img,
  className = '',
  onClick,
}: {
  img: GalleryImage
  className?: string
  onClick?: () => void
}) {
  return (
    <div
      className={`relative overflow-hidden ${onClick ? 'cursor-zoom-in' : ''} ${className}`}
      onClick={onClick}
    >
      <img src={img.src} alt={img.caption ?? ''} className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40 pointer-events-none" />
      <Caption text={img.caption} />
    </div>
  )
}

function Single({ images, onOpen }: { images: GalleryImage[]; onOpen: (i: number) => void }) {
  return (
    <div className="h-screen">
      <Img img={images[0]} className="h-full" onClick={() => onOpen(0)} />
    </div>
  )
}

function Duo({ images, onOpen }: { images: GalleryImage[]; onOpen: (i: number) => void }) {
  return (
    <div className="h-screen flex gap-0.5">
      <Img img={images[0]} className="flex-1" onClick={() => onOpen(0)} />
      <Img img={images[1]} className="flex-1" onClick={() => onOpen(1)} />
    </div>
  )
}

function Trio({ images, onOpen }: { images: GalleryImage[]; onOpen: (i: number) => void }) {
  return (
    <div className="relative py-12 flex flex-col gap-3">
      <div className="relative h-[65vh] w-[60%] self-start">
        <Img img={images[0]} className="h-full" onClick={() => onOpen(0)} />
      </div>
      <div className="relative h-[65vh] w-[60%] self-center">
        <Img img={images[1]} className="h-full" onClick={() => onOpen(1)} />
      </div>
      <div className="relative h-[65vh] w-[60%] self-end">
        <Img img={images[2]} className="h-full" onClick={() => onOpen(2)} />
      </div>
    </div>
  )
}

function Quad({ images, onOpen }: { images: GalleryImage[]; onOpen: (i: number) => void }) {
  return (
    <div className="relative py-10 flex flex-col gap-3">
      {images.slice(0, 4).map((img, i) => (
        <div
          key={i}
          className={`relative h-[80vh] w-[70%] ${i % 2 === 0 ? 'self-start' : 'self-end'}`}
        >
          <Img img={img} className="h-full" onClick={() => onOpen(i)} />
        </div>
      ))}
    </div>
  )
}

function Grid({ images, onOpen }: { images: GalleryImage[]; onOpen: (i: number) => void }) {
  return (
    <div className="bg-stone-100 py-10 px-6 sm:px-12">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-w-5xl mx-auto">
        {images.map((img, i) => (
          <button
            key={i}
            onClick={() => onOpen(i)}
            className="relative aspect-square overflow-hidden group cursor-zoom-in block"
          >
            <img
              src={img.src}
              alt={img.caption ?? ''}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </button>
        ))}
      </div>
    </div>
  )
}

export default function GalleryChapter({ chapter }: { chapter: GalleryChapterType }) {
  const { layout, images } = chapter
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)

  if (!images?.length) return null

  return (
    <div className="relative z-10 pointer-events-auto">
      {layout === 'duo'   && <Duo    images={images} onOpen={setLightboxIdx} />}
      {layout === 'trio'  && <Trio   images={images} onOpen={setLightboxIdx} />}
      {layout === 'quad'  && <Quad   images={images} onOpen={setLightboxIdx} />}
      {layout === 'grid'  && <Grid   images={images} onOpen={setLightboxIdx} />}
      {(layout === 'single' || !layout) && <Single images={images} onOpen={setLightboxIdx} />}

      {lightboxIdx !== null && (
        <Lightbox
          images={images}
          index={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
          onNav={setLightboxIdx}
        />
      )}
    </div>
  )
}
