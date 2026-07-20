#!/usr/bin/env node
// Parse a folder of daily GPX tracks into route data for a GeoStory.
//
// Usage:
//   node scripts/gpx-import.mjs content/stories/raw/brooks-range/gpx
//
// Expects one .gpx file per day in the given folder (sorted by filename —
// name them so they sort in trip order, e.g. day-01.gpx, day-02.gpx, ...).
//
// For each file, writes a sibling <name>.json with:
//   { file, date, distance_m, start: [lng,lat], end: [lng,lat], route: [[lng,lat], ...] }
// (route decimated to ~MAX_POINTS, coordinates in [lng, lat] to match repo convention)
//
// Also writes combined.json in the same folder: every day's decimated route
// concatenated in order, plus per-day cut points (route index where each day
// starts) — useful for building the story's top-level `route` field and for
// computing routeProgress per chapter.

import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const MAX_POINTS_PER_DAY = 150

function haversineMeters([lng1, lat1], [lng2, lat2]) {
  const R = 6371000
  const toRad = (d) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

function decimate(points, max) {
  if (points.length <= max) return points
  const stride = points.length / max
  const out = []
  for (let i = 0; i < max; i++) out.push(points[Math.floor(i * stride)])
  out.push(points[points.length - 1])
  return out
}

function parseGpx(xml) {
  const points = []
  const trkptRe = /<trkpt\b[^>]*\blat="([^"]+)"[^>]*\blon="([^"]+)"[^>]*>([\s\S]*?)<\/trkpt>/g
  let m
  while ((m = trkptRe.exec(xml))) {
    const lat = parseFloat(m[1])
    const lon = parseFloat(m[2])
    const body = m[3]
    const timeMatch = body.match(/<time>([^<]+)<\/time>/)
    points.push({ lng: lon, lat, time: timeMatch ? timeMatch[1] : null })
  }
  return points
}

function processFile(filePath) {
  const xml = readFileSync(filePath, 'utf8')
  const points = parseGpx(xml)
  if (!points.length) {
    console.warn(`  no trkpt found in ${filePath}`)
    return null
  }

  const fullRoute = points.map((p) => [p.lng, p.lat])
  let distance_m = 0
  for (let i = 1; i < fullRoute.length; i++) {
    distance_m += haversineMeters(fullRoute[i - 1], fullRoute[i])
  }

  const route = decimate(fullRoute, MAX_POINTS_PER_DAY)
  const date = points[0].time ? points[0].time.slice(0, 10) : null

  return {
    file: path.basename(filePath),
    date,
    distance_m: Math.round(distance_m),
    start: route[0],
    end: route[route.length - 1],
    route,
  }
}

const dir = process.argv[2]
if (!dir) {
  console.error('Usage: node scripts/gpx-import.mjs <folder-of-gpx-files>')
  process.exit(1)
}

const files = readdirSync(dir)
  .filter((f) => f.toLowerCase().endsWith('.gpx'))
  .sort()

if (!files.length) {
  console.error(`No .gpx files found in ${dir}`)
  process.exit(1)
}

const days = []
for (const file of files) {
  console.log(`parsing ${file}...`)
  const result = processFile(path.join(dir, file))
  if (!result) continue
  const outPath = path.join(dir, file.replace(/\.gpx$/i, '.json'))
  writeFileSync(outPath, JSON.stringify(result, null, 2))
  const km = (result.distance_m / 1000).toFixed(1)
  console.log(`  -> ${outPath}  (${result.route.length} pts, ${km}km, ${result.date ?? 'no date'})`)
  days.push(result)
}

// Combined route across all days, with per-day start indices for routeProgress math
let combinedRoute = []
const dayMarkers = []
for (const d of days) {
  dayMarkers.push({ file: d.file, date: d.date, startIndex: combinedRoute.length })
  combinedRoute = combinedRoute.concat(d.route)
}

const combined = {
  totalPoints: combinedRoute.length,
  totalDistance_m: days.reduce((sum, d) => sum + d.distance_m, 0),
  dayMarkers,
  route: combinedRoute,
}
writeFileSync(path.join(dir, 'combined.json'), JSON.stringify(combined, null, 2))
console.log(`\nWrote combined.json — ${combinedRoute.length} total points across ${days.length} days`)
