// Format a [lng, lat] pair (Mapbox convention) as degrees/minutes/seconds.

function dms(value: number, positive: string, negative: string): string {
  const dir = value >= 0 ? positive : negative
  const abs = Math.abs(value)
  let d = Math.floor(abs)
  let m = Math.floor((abs - d) * 60)
  let s = Math.round((abs - d - m / 60) * 3600)
  if (s === 60) { s = 0; m += 1 }
  if (m === 60) { m = 0; d += 1 }
  return `${d}°${m}′${s}″${dir}`
}

export function formatCoords([lng, lat]: [number, number]): string {
  return `${dms(lat, 'N', 'S')} ${dms(lng, 'E', 'W')}`
}
