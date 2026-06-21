// Client-only heuristics for spotting memory-constrained devices (phones/tablets,
// especially iOS Safari). The PDF surfaces decode very large scanned-image pages
// (the al-Khoei rijal scans are 9.3-megapixel 600-dpi bilevel images), and mobile
// Safari enforces a small total canvas-memory budget: when several full-resolution
// page bitmaps are alive at once it silently blanks the canvases (the "PDF is just
// white on mobile" symptom). We use this flag to render fewer pages at once, at a
// capped DPR, so the peak canvas memory stays well under that budget. Desktop
// browsers have a far larger budget and are left at full quality/concurrency.

let cached: boolean | null = null

export function isConstrainedDevice(): boolean {
  if (cached !== null) return cached

  if (typeof navigator === 'undefined' || typeof window === 'undefined') {
    cached = false
    return cached
  }

  // Chromium-only; reports approximate RAM in GiB. Absent on Safari/Firefox.
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory
  const lowMemory = typeof memory === 'number' && memory > 0 && memory <= 4

  const touch = (navigator.maxTouchPoints ?? 0) > 0
  const ua = navigator.userAgent || ''
  // iPadOS 13+ presents itself as desktop Safari ("Macintosh"); the touch check
  // disambiguates it from a real Mac.
  const isIOS = /iP(hone|ad|od)/.test(ua) || (/Macintosh/.test(ua) && touch)

  // A coarse *primary* pointer means a finger-driven device. Touch laptops keep a
  // fine primary pointer (the trackpad/mouse), so they are correctly excluded.
  const coarsePrimary =
    typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches

  cached = lowMemory || isIOS || (coarsePrimary && touch)
  return cached
}
