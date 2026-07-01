import type { TopoChapter } from './types'

export default function PitchChapter({ chapter }: { chapter: TopoChapter }) {
  const align = chapter.align ?? 'left'

  return (
    <div className="min-h-[85vh] flex items-center py-20 pointer-events-none">
      <div className={`w-full flex gap-8 items-center px-8 sm:px-14 ${align === 'right' ? 'flex-row-reverse' : 'flex-row'}`}>

        {/* Text panel — same style as MapChapter */}
        <div className="pointer-events-auto bg-white/75 backdrop-blur-sm shadow-lg max-w-sm w-full p-6 shrink-0">
          {chapter.subheading && (
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-400 mb-2">
              {chapter.subheading}
            </p>
          )}
          {chapter.heading && (
            <h2 className="text-xl font-bold text-stone-900 mb-1 leading-snug tracking-tight">
              {chapter.heading}
            </h2>
          )}
          {chapter.pitch != null && (
            <p className="text-sm text-stone-400 mb-3">Pitch {chapter.pitch}</p>
          )}
          {chapter.text && (
            <p className="text-sm text-stone-600 leading-relaxed">{chapter.text}</p>
          )}
        </div>

        {/* Foreground photo */}
        {chapter.foregroundImage && chapter.foregroundAlign !== 'full' && (
          <div className="pointer-events-auto flex-1 min-w-0 h-[60vh] overflow-hidden rounded shadow-2xl">
            <img src={chapter.foregroundImage} alt="" className="w-full h-full object-cover" />
          </div>
        )}
      </div>

      {/* Full-width foreground photo — overlaid at the bottom */}
      {chapter.foregroundImage && chapter.foregroundAlign === 'full' && (
        <div className="absolute inset-x-0 bottom-0 h-[45vh] pointer-events-auto">
          <img src={chapter.foregroundImage} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30" />
        </div>
      )}
    </div>
  )
}
