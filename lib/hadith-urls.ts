// Library-relative (un-basePath-ed) URLs for a hadith and its chapter.
// Extracted from HadithCard so other surfaces (random hadith, share links)
// build identical routes. Callers must wrap with withBasePath for raw
// anchors / router.push (next/link handles it via the middleware rewrite).

import { Hadith } from './api'
import { getBookConfig, getBookUrlSlug } from './books-config'

export function getHadithUrl(hadith: Hadith): string {
  const bookId = hadith.bookId || ''
  const cfg = getBookConfig(bookId)

  // Multi-volume books: ids restart at 1 per volume, so the volume must be in
  // the URL or the link is ambiguous. Single-volume books need no volume segment.
  if (cfg?.hasMultipleVolumes && hadith.volume) {
    const slug = cfg.bookId === 'Al-Kafi' ? 'al-kafi' : getBookUrlSlug(cfg.bookId)
    return `/${slug}/volume/${hadith.volume}/hadith/${hadith.id}`
  }

  if (cfg) {
    return cfg.bookId === 'Al-Kafi'
      ? `/al-kafi/hadith/${hadith.id}`
      : `/${getBookUrlSlug(cfg.bookId)}/hadith/${hadith.id}`
  }
  if (bookId.includes('Uyun') || hadith.book?.toLowerCase().includes('uyun')) {
    return hadith.volume
      ? `/uyun-akhbar-al-rida/volume/${hadith.volume}/hadith/${hadith.id}`
      : `/Uyun-akhbar-al-Rida/hadith/${hadith.id}`
  }
  if (bookId) return `/${getBookUrlSlug(bookId)}/hadith/${hadith.id}`
  return `/al-kafi/hadith/${hadith.id}`
}

export function getChapterUrl(hadith: Hadith): string {
  const bookId = hadith.bookId || ''
  const cfg = getBookConfig(bookId)
  let basePath = '/al-kafi'
  let isAlKafi = true
  let isMultiVolume = false

  if (cfg) {
    isMultiVolume = Boolean(cfg.hasMultipleVolumes)
    if (cfg.bookId === 'Al-Kafi') {
      basePath = '/al-kafi'
    } else {
      basePath = `/${getBookUrlSlug(cfg.bookId)}`
      isAlKafi = false
    }
  } else if (bookId.includes('Uyun') || hadith.book?.toLowerCase().includes('uyun')) {
    basePath = '/Uyun-akhbar-al-Rida'
    isAlKafi = false
  } else if (bookId) {
    basePath = `/${getBookUrlSlug(bookId)}`
    isAlKafi = false
  }

  return isAlKafi || isMultiVolume
    ? `${basePath}/volume/${hadith.volume}/chapter/${hadith.categoryId}/${hadith.chapterInCategoryId}`
    : `${basePath}/chapter/${hadith.categoryId}/${hadith.chapterInCategoryId}`
}
