import { NextRequest } from 'next/server'
import { describe, expect, it } from 'vitest'
import { middleware } from '@/middleware'

function request(path: string) {
  return new NextRequest(`http://localhost${path}`)
}

describe('root-level section routing', () => {
  it('lets clean narrators, scans, and bookmarks URLs resolve as root app routes', () => {
    const narrators = middleware(request('/narrators/khoei-v1-1/pdf?x=1'))
    expect(narrators?.headers.get('x-middleware-next')).toBe('1')

    const scans = middleware(request('/scans?source=rijal-khoei&volume=1'))
    expect(scans?.headers.get('x-middleware-next')).toBe('1')

    const bookmarks = middleware(request('/bookmarks'))
    expect(bookmarks?.headers.get('x-middleware-next')).toBe('1')
  })

  it('rewrites the /read library namespace to the real app and public paths', () => {
    const home = middleware(request('/read?x=1'))
    expect(home?.headers.get('x-middleware-rewrite')).toBe('http://localhost/?x=1')

    const book = middleware(request('/read/al-kafi/volume/1?x=1'))
    expect(book?.headers.get('x-middleware-rewrite')).toBe('http://localhost/al-kafi/volume/1?x=1')

    const api = middleware(request('/read/api/search?q=test'))
    expect(api?.headers.get('x-middleware-rewrite')).toBe('http://localhost/api/search?q=test')
  })

  it('redirects old prefixed tool URLs to clean root URLs', () => {
    const narrators = middleware(request('/read/narrators/khoei-v1-1?x=1'))
    expect(narrators?.status).toBe(308)
    expect(narrators?.headers.get('location')).toBe('http://localhost/narrators/khoei-v1-1?x=1')

    const scans = middleware(request('/read/scans?source=rijal-khoei'))
    expect(scans?.status).toBe(308)
    expect(scans?.headers.get('location')).toBe('http://localhost/scans?source=rijal-khoei')

    const bookmarks = middleware(request('/read/bookmarks'))
    expect(bookmarks?.status).toBe(308)
    expect(bookmarks?.headers.get('location')).toBe('http://localhost/bookmarks')
  })

  it('redirects the common /reads typo for clean root sections', () => {
    const scans = middleware(request('/reads/scans?source=rijal-khoei'))
    expect(scans?.status).toBe(308)
    expect(scans?.headers.get('location')).toBe('http://localhost/scans?source=rijal-khoei')

    const bookmarks = middleware(request('/reads/bookmarks'))
    expect(bookmarks?.status).toBe(308)
    expect(bookmarks?.headers.get('location')).toBe('http://localhost/bookmarks')
  })

  it('redirects root library book URLs into /read', () => {
    const book = middleware(request('/Al-Kafi/Volume/1?x=1'))
    expect(book?.status).toBe(308)
    expect(book?.headers.get('location')).toBe('http://localhost/read/al-kafi/volume/1?x=1')
  })

  it('lowercases known book URLs inside /read before rewriting', () => {
    const response = middleware(request('/read/Al-Kafi/Volume/1?x=1'))
    expect(response?.status).toBe(301)
    expect(response?.headers.get('location')).toBe('http://localhost/read/al-kafi/volume/1?x=1')
  })
})
