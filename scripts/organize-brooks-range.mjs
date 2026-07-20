#!/usr/bin/env node
// Bucket the Brooks Range photos/videos into trip days, using GPX time
// windows as day boundaries and each file's EXIF capture time.
//
// Photos carry DateTimeOriginal in local AKDT with no UTC offset (camera
// clock) — treated as UTC-8. Videos don't have a usable DateTimeOriginal;
// their real capture time lives in the Apple "Keys:CreationDate" tag, which
// does carry an explicit offset.
//
// Usage: node scripts/organize-brooks-range.mjs
// Writes content/stories/raw/brooks-range/manifest.json

import { execSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const GPX_DIR    = 'content/stories/raw/brooks-range/gpx'
const IMAGES_DIR = 'images'
const OUT_PATH   = 'content/stories/raw/brooks-range/manifest.json'

// ── GPX day windows ──────────────────────────────────────────────────────────
function gpxWindow(file) {
  const xml = readFileSync(path.join(GPX_DIR, file), 'utf8')
  const times = [...xml.matchAll(/<time>([^<]+)<\/time>/g)].map((m) => m[1])
  return { start: new Date(times[0]).getTime(), end: new Date(times.at(-1)).getTime() }
}

const segments = [
  { day: 'day1',         file: 'Brooks_Range_Day_1_Hula_Hula_River.gpx' },
  { day: 'day2',         file: 'Brooks_Range_Day_2_To_the_glacier.gpx' },
  { day: 'day3',         file: 'Brooks_Range_Day_3_Esetuk_Glacier_to_Okpilak.gpx' },
  { day: 'day4',         file: 'Brooks_Range_Day_4_To_the_Okpilak_headwaters_and_back.gpx' },
  { day: 'day6a',        file: 'Brooks_Range_Day_6a_Daughter_of_Gallahop_Ridge.gpx' },
  { day: 'day6b',        file: 'Brooks_Range_Day_6b_To_the_coastal_plain.gpx' },
  { day: 'day7-sea',     file: 'Brooks_Range_Day_7_To_the_Sea.gpx' },
  { day: 'day7-portage', file: 'Brooks_Range_Day_7_Portage_to_the_Lagoon.gpx' },
  { day: 'day8',         file: 'Brooks_Range_Day_8_Across_the_Lagoon_to_Barter_Island.gpx' },
].map((s) => ({ ...s, ...gpxWindow(s.file) }))

function bucketFor(t) {
  if (t < segments[0].start) return 'day0'
  // day5 rest-day gap: between day4's end and day6a's start
  const day4 = segments.find((s) => s.day === 'day4')
  const day6a = segments.find((s) => s.day === 'day6a')
  if (t > day4.end && t < day6a.start) return 'day5'

  for (const s of segments) {
    if (t >= s.start && t <= s.end) return s.day
  }
  // Gap between two segments (evening/camp) or trailing past day8 —
  // attach to the closest preceding segment.
  let best = segments[0]
  for (const s of segments) {
    if (s.start <= t) best = s
  }
  return best.day
}

// ── Dedupe exact-content duplicates (re-exports under different names) ───────
const allFiles = readdirSync(IMAGES_DIR).filter((f) => /\.(jpe?g|mov)$/i.test(f))
const byHash = new Map()
for (const f of allFiles) {
  const hash = createHash('md5').update(readFileSync(path.join(IMAGES_DIR, f))).digest('hex')
  if (!byHash.has(hash)) byHash.set(hash, [])
  byHash.get(hash).push(f)
}
const dropped = new Set()
for (const names of byHash.values()) {
  if (names.length < 2) continue
  // keep the name without a "(n)" suffix if present, else the lowest IMG number
  names.sort((a, b) => {
    const aDup = /\(\d+\)/.test(a), bDup = /\(\d+\)/.test(b)
    if (aDup !== bDup) return aDup ? 1 : -1
    return a.localeCompare(b)
  })
  for (const dup of names.slice(1)) dropped.add(dup)
}
if (dropped.size) {
  console.log(`Deduped ${dropped.size} exact-content duplicate(s):`, [...dropped].join(', '))
}

// ── EXIF ──────────────────────────────────────────────────────────────────────
const files = allFiles.filter((f) => !dropped.has(f))

const fileArgs = files.map((f) => `"${path.join(IMAGES_DIR, f)}"`).join(' ')
const exifJson = execSync(
  `exiftool -json -FileName -DateTimeOriginal -Keys:CreationDate -GPSLatitude# -GPSLongitude# ${fileArgs}`,
  { maxBuffer: 50 * 1024 * 1024 }
).toString()
const exif = JSON.parse(exifJson)

function toUtcMs(entry) {
  // Videos: Keys:CreationDate has an explicit offset, e.g. "2026:07:04 21:13:48-08:00"
  if (entry.CreationDate) {
    const m = entry.CreationDate.match(
      /(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})([+-]\d{2}:\d{2})/
    )
    if (m) {
      const [, y, mo, d, h, mi, s, off] = m
      return new Date(`${y}-${mo}-${d}T${h}:${mi}:${s}${off}`).getTime()
    }
  }
  // Photos: DateTimeOriginal is local camera time, no offset — assume AKDT (UTC-8)
  if (entry.DateTimeOriginal) {
    const m = entry.DateTimeOriginal.match(/(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})/)
    if (m) {
      const [, y, mo, d, h, mi, s] = m
      return new Date(`${y}-${mo}-${d}T${h}:${mi}:${s}-08:00`).getTime()
    }
  }
  return null
}

const manifest = {}
for (const s of segments) manifest[s.day] = []
manifest.day0 = []
manifest.day5 = []

let skipped = 0
for (const entry of exif) {
  const ms = toUtcMs(entry)
  if (ms === null) { skipped++; continue }
  const day = bucketFor(ms)
  manifest[day] ??= []
  manifest[day].push({
    file: entry.FileName,
    time: new Date(ms).toISOString(),
    lat: entry.GPSLatitude ?? null,
    lng: entry.GPSLongitude ?? null,
  })
}

for (const day of Object.keys(manifest)) {
  manifest[day].sort((a, b) => a.time.localeCompare(b.time))
}

writeFileSync(OUT_PATH, JSON.stringify(manifest, null, 2))

console.log('Day buckets:')
const order = ['day0', 'day1', 'day2', 'day3', 'day4', 'day5', 'day6a', 'day6b', 'day7-sea', 'day7-portage', 'day8']
for (const day of order) {
  console.log(`  ${day.padEnd(14)} ${manifest[day].length}`)
}
if (skipped) console.log(`\n${skipped} file(s) had no usable timestamp, skipped`)
console.log(`\nWrote ${OUT_PATH}`)
