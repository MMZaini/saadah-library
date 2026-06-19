import { afterEach, describe, expect, it } from 'vitest'
import { withBasePath } from '../lib/assets.ts'

const originalBasePath = process.env.NEXT_PUBLIC_BASE_PATH

afterEach(() => {
  if (originalBasePath === undefined) {
    delete process.env.NEXT_PUBLIC_BASE_PATH
  } else {
    process.env.NEXT_PUBLIC_BASE_PATH = originalBasePath
  }
})

describe('withBasePath', () => {
  it('prefixes local public asset paths when a base path is configured', () => {
    process.env.NEXT_PUBLIC_BASE_PATH = '/read'

    expect(withBasePath('/covers/1-round.jpeg')).toBe('/read/covers/1-round.jpeg')
  })

  it('does not double-prefix paths', () => {
    process.env.NEXT_PUBLIC_BASE_PATH = '/read'

    expect(withBasePath('/read/covers/1-round.jpeg')).toBe('/read/covers/1-round.jpeg')
  })

  it('leaves non-local paths unchanged', () => {
    process.env.NEXT_PUBLIC_BASE_PATH = '/read'

    expect(withBasePath('https://example.com/cover.jpeg')).toBe('https://example.com/cover.jpeg')
    expect(withBasePath('//example.com/cover.jpeg')).toBe('//example.com/cover.jpeg')
  })
})
