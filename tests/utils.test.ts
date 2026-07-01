import { describe, expect, it } from 'vitest'
import { cn, hasHarakat, removeHarakat } from '../lib/utils'

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
