import { describe, expect, it } from 'vitest'
import { cn, hasHarakat, normalizeArabicPresentation, removeHarakat } from '../lib/utils'

describe('cn (class name merge)', () => {
  it('joins conditional classes and resolves Tailwind conflicts', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4')
    expect(cn('text-sm', false && 'hidden', undefined, 'font-bold')).toBe('text-sm font-bold')
    expect(cn(['flex', { 'items-center': true, 'justify-end': false }])).toBe('flex items-center')
  })
})

describe('harakat helpers', () => {
  const vocalized = 'إِنَّ ٱلصَّلَاةَ عَمُودُ ٱلدِّينِ'
  const plain = 'ان الصلاة عمود الدين'

  it('detects harakat only when present', () => {
    expect(hasHarakat(vocalized)).toBe(true)
    expect(hasHarakat(plain)).toBe(false)
    expect(hasHarakat('plain english')).toBe(false)
    expect(hasHarakat('')).toBe(false)
  })

  it('strips harakat but keeps base letters intact', () => {
    const stripped = removeHarakat(vocalized)
    expect(hasHarakat(stripped)).toBe(false)
    // Letter skeleton must survive (including alef wasla, which is not a harakat).
    expect(stripped).toBe('إن ٱلصلاة عمود ٱلدين')
    expect(removeHarakat(plain)).toBe(plain)
  })

  it('strips superscript alef (U+0670)', () => {
    expect(removeHarakat('رحمٰن')).toBe('رحمن')
  })
})

describe('normalizeArabicPresentation', () => {
  it('folds Farsi yeh (U+06CC) to Arabic yeh (U+064A)', () => {
    expect(normalizeArabicPresentation('رَضِیتُ')).toBe('رَضِيتُ')
    expect('رَضِیتُ'.includes('ی')).toBe(true)
    expect(normalizeArabicPresentation('رَضِیتُ').includes('ی')).toBe(false)
  })

  it('folds keheh (U+06A9) to Arabic kaf (U+0643)', () => {
    expect(normalizeArabicPresentation('کَانَ')).toBe('كَانَ')
  })

  it('folds heh variants (U+06BE / U+06C1) to Arabic heh (U+0647)', () => {
    expect(normalizeArabicPresentation('ھہ')).toBe('هه')
  })

  it('folds extended (Persian) digits to standard Arabic-Indic digits', () => {
    expect(normalizeArabicPresentation('۰۱۲۳۴۵۶۷۸۹')).toBe('٠١٢٣٤٥٦٧٨٩')
  })

  it('cleans the reported hadith (Thawab al-Amal #105) end to end', () => {
    const raw =
      'رَضِیتُ بِاللَّهِ رَبّاً وَ بِالْإِسْلَامِ دِیناً وَ بِأَهْلِ بَیْتِهِ أَوْلِیَاءَ کَانَ حَقّاً عَلَی اللَّهِ أَنْ یُرْضِیَهُ یَوْمَ الْقِیَامَهِ'
    const cleaned = normalizeArabicPresentation(raw)
    expect(cleaned).not.toMatch(/[یکڪھہ]/)
    expect(cleaned).toContain('رَضِيتُ')
    expect(cleaned).toContain('كَانَ')
    expect(cleaned).toContain('الْقِيَامَهِ')
  })

  it('leaves standard Arabic, harakat, and non-folded chars untouched', () => {
    const text = 'إِنَّ ٱلصَّلَاةَ عَمُودُ ٱلدِّينِ ي ك ه ؟'
    expect(normalizeArabicPresentation(text)).toBe(text)
  })

  it('does not touch genuinely Persian letters without an Arabic equivalent', () => {
    // پ چ گ ژ are handled by the font-layer unicode-range fallback, not here.
    expect(normalizeArabicPresentation('پچگژ')).toBe('پچگژ')
  })

  it('is idempotent and passes through empty/undefined', () => {
    const once = normalizeArabicPresentation('عَلَی الْقِیَامَهِ')
    expect(normalizeArabicPresentation(once)).toBe(once)
    expect(normalizeArabicPresentation(undefined)).toBeUndefined()
    expect(normalizeArabicPresentation('')).toBe('')
  })
})
