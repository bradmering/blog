import type { Coordinates } from '@/lib/posts'
import { formatCoordPoint, mapUrl } from '@/lib/posts'

export default function CoordinatesDisplay({ coords }: { coords: Coordinates }) {
  const href = mapUrl(coords)
  const hasRoute = !!coords.end

  return (
    <span className="flex items-center gap-1.5 text-sm text-stone-400">
      <span className="text-stone-300" aria-hidden>⌖</span>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-stone-500 hover:text-stone-900 underline underline-offset-2 transition-colors ml-0.5"
      >
      {hasRoute ? (
        <span>
          {formatCoordPoint(coords.start)}
          <span className="mx-1 text-stone-600">→</span>
          {formatCoordPoint(coords.end!)}
        </span>
      ) : (
        <span>{formatCoordPoint(coords.start)}</span>
      )}
      </a>
    </span>
  )
}
