#!/bin/bash
# convert-to-webp.sh — convert a folder of images to well-scaled, correctly oriented WebP
#
# Usage:
#   ./scripts/convert-to-webp.sh <input-dir> [options]
#
# Options:
#   --out DIR        Output directory (default: same as input)
#   --max PX         Max width or height in pixels (default: 2400)
#   --quality N      WebP quality 0-100 (default: 85)
#   --skip-existing  Skip files that already have a .webp counterpart in the output dir
#   --dry-run        Print what would happen without converting anything

set -uo pipefail

# ── Defaults ─────────────────────────────────────────────────────────────────
INPUT_DIR=""
OUTPUT_DIR=""
MAX_PX=2400
QUALITY=85
SKIP_EXISTING=false
DRY_RUN=false

# ── Argument parsing ──────────────────────────────────────────────────────────
while [ $# -gt 0 ]; do
  case "$1" in
    --out)           OUTPUT_DIR="$2"; shift 2 ;;
    --max)           MAX_PX="$2";    shift 2 ;;
    --quality)       QUALITY="$2";   shift 2 ;;
    --skip-existing) SKIP_EXISTING=true; shift ;;
    --dry-run)       DRY_RUN=true;   shift ;;
    -h|--help)
      grep '^#' "$0" | grep -v '^#!/' | sed 's/^# //' | sed 's/^#//'
      exit 0 ;;
    -*)
      echo "Unknown option: $1" >&2; exit 1 ;;
    *)
      INPUT_DIR="$1"; shift ;;
  esac
done

if [ -z "$INPUT_DIR" ]; then
  echo "Usage: $(basename "$0") <input-dir> [--out DIR] [--max PX] [--quality N] [--skip-existing] [--dry-run]" >&2
  exit 1
fi

if [ ! -d "$INPUT_DIR" ]; then
  echo "Error: '$INPUT_DIR' is not a directory" >&2
  exit 1
fi

if ! command -v magick >/dev/null 2>&1; then
  echo "Error: ImageMagick (magick) not found. Install with: brew install imagemagick" >&2
  exit 1
fi

OUTPUT_DIR="${OUTPUT_DIR:-$INPUT_DIR}"
mkdir -p "$OUTPUT_DIR"

# ── Count and list images ─────────────────────────────────────────────────────
TOTAL=$(find "$INPUT_DIR" -maxdepth 1 -type f \
  \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" \
     -o -iname "*.heic" -o -iname "*.heif" \) | wc -l | tr -d ' ')

if [ "$TOTAL" -eq 0 ]; then
  echo "No JPG/PNG/HEIC files found in '$INPUT_DIR'."
  exit 0
fi

echo "Found $TOTAL image(s) in '$INPUT_DIR'"
echo "Output → '$OUTPUT_DIR'  |  max ${MAX_PX}px  |  quality ${QUALITY}"
$DRY_RUN && echo "[dry-run — no files will be written]"
echo ""

# ── Convert ───────────────────────────────────────────────────────────────────
SUCCESS=0
SKIPPED=0
FAILED=0

while IFS= read -r src; do
  base=$(basename "$src")
  # strip extension (handles multi-dot names correctly)
  name="${base%.*}"
  dest="$OUTPUT_DIR/${name}.webp"

  if $SKIP_EXISTING && [ -f "$dest" ]; then
    printf "  skip  %s  (%s.webp exists)\n" "$base" "$name"
    SKIPPED=$((SKIPPED + 1))
    continue
  fi

  if $DRY_RUN; then
    printf "  would  %s  →  %s.webp\n" "$base" "$name"
    SUCCESS=$((SUCCESS + 1))
    continue
  fi

  orig_dims=$(magick identify -format "%wx%h" "$src" 2>/dev/null || echo "?x?")
  src_kb=$(( $(wc -c < "$src") / 1024 ))

  if magick "$src" \
      -auto-orient \
      -resize "${MAX_PX}x${MAX_PX}>" \
      -quality "$QUALITY" \
      "$dest" 2>/dev/null; then
    new_dims=$(magick identify -format "%wx%h" "$dest" 2>/dev/null || echo "?x?")
    dst_kb=$(( $(wc -c < "$dest") / 1024 ))
    printf "  ✓  %-38s  %8s → %-8s  (%dKB → %dKB)\n" \
      "$base" "$orig_dims" "$new_dims" "$src_kb" "$dst_kb"
    SUCCESS=$((SUCCESS + 1))
  else
    printf "  ✗  %s  (conversion failed)\n" "$base"
    FAILED=$((FAILED + 1))
  fi

done < <(find "$INPUT_DIR" -maxdepth 1 -type f \
  \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" \
     -o -iname "*.heic" -o -iname "*.heif" \) \
  | sort)

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo "Done: ${SUCCESS} converted, ${SKIPPED} skipped, ${FAILED} failed"
