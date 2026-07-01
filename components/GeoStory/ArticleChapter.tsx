'use client'

import { useState, useMemo } from 'react'
import type { ArticleChapter as ArticleChapterType, ArticleBlock } from './types'
import Lightbox from './Lightbox'

function Block({
  block,
  imageIdx,
  onOpen,
}: {
  block: ArticleBlock
  imageIdx: number
  onOpen: (i: number) => void
}) {
  if (block.image && block.align === 'full') {
    return (
      <div className="my-10 -mx-6 sm:-mx-12 relative">
        <img
          src={block.image}
          alt={block.caption ?? ''}
          className="w-full object-cover max-h-[75vh] cursor-zoom-in"
          onClick={() => onOpen(imageIdx)}
        />
        {block.caption && (
          <p className="mt-2 text-center text-stone-400 text-xs italic px-6">{block.caption}</p>
        )}
      </div>
    )
  }

  if (block.image && (block.align === 'left' || block.align === 'right')) {
    const isLeft = block.align === 'left'
    return (
      <div className={`my-6 ${isLeft ? 'float-left mr-8 ml-0' : 'float-right ml-8 mr-0'} w-[55%] sm:w-[50%]`}>
        <img
          src={block.image}
          alt={block.caption ?? ''}
          className="w-full object-cover rounded cursor-zoom-in"
          onClick={() => onOpen(imageIdx)}
        />
        {block.caption && (
          <p className="mt-1.5 text-stone-400 text-xs italic">{block.caption}</p>
        )}
      </div>
    )
  }

  if (block.image) {
    return (
      <div className="my-8 -mx-6 sm:-mx-12 relative">
        <img
          src={block.image}
          alt={block.caption ?? ''}
          className="w-full object-cover max-h-[70vh] cursor-zoom-in"
          onClick={() => onOpen(imageIdx)}
        />
        {block.caption && (
          <p className="mt-2 text-center text-stone-400 text-xs italic px-6">{block.caption}</p>
        )}
      </div>
    )
  }

  if (block.textHtml) {
    return (
      <div
        className="prose prose-stone max-w-none my-5"
        dangerouslySetInnerHTML={{ __html: block.textHtml }}
      />
    )
  }

  if (block.text) {
    return <p className="my-5 text-stone-700 leading-8 text-[1.05rem]">{block.text}</p>
  }

  return null
}

export default function ArticleChapter({ chapter }: { chapter: ArticleChapterType }) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)

  // Collect all images across blocks for lightbox navigation
  const lightboxImages = useMemo(
    () =>
      chapter.blocks
        .filter((b) => b.image)
        .map((b) => ({ src: b.image!, caption: b.caption })),
    [chapter.blocks]
  )

  // Map each block to its index in lightboxImages
  let imgCounter = -1
  const blocksWithIdx = chapter.blocks.map((block) => {
    if (block.image) imgCounter++
    return { block, imageIdx: block.image ? imgCounter : -1 }
  })

  return (
    <div className="relative z-10 bg-stone-50">
      <div className="clearfix max-w-4xl mx-auto px-6 sm:px-12 py-16">
        {blocksWithIdx.map(({ block, imageIdx }, i) => (
          <Block key={i} block={block} imageIdx={imageIdx} onOpen={setLightboxIdx} />
        ))}
        <div className="clear-both" />
      </div>

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
