import { describe, expect, it } from 'vitest'
import {
  parseChapterPage,
  parseSitemap,
  websiteHadithToLegacyShape,
} from '../../scripts/data/thaqalayn-page-parser.mjs'

const encodedChunk = JSON.stringify(
  'x,"chapterName":"The Book","bookName":"Al-Kafi","volumeNumber":1,"bookSectionNumber":1,"chapterNumber":0,"urlPointer":"1"},"hadiths":[{"id":2,"number":1,"number_by_book":2,"text_en":"English text","text_ar":"Arabic text","gradings":[{"grade_en":null,"grade_ar":"مرسل","reference_en":"Ref","author":{"name_en":"Allamah Baqir al-Majlisi","name_ar":"Arabic"}}]}]}',
)

describe('Thaqalayn page parser', () => {
  it('extracts chapter metadata and hadith arrays from Next flight data', () => {
    const html = `<html><script>self.__next_f.push([1,${encodedChunk}])</script></html>`
    const parsed = parseChapterPage(html, 'https://thaqalayn.net/chapter/1/1/0')

    expect(parsed.warnings).toEqual([])
    expect(parsed.meta.bookName).toBe('Al-Kafi')
    expect(parsed.meta.chapterName).toBe('The Book')
    expect(parsed.hadiths).toHaveLength(1)
    expect(parsed.hadiths[0].text_en).toBe('English text')
  })

  it('reassembles hadith arrays that span multiple flight chunks', () => {
    // Next.js splits the RSC stream at arbitrary byte boundaries. Force a
    // boundary to land inside a string literal — the regression that broke the
    // data workflow with "Bad control character in string literal in JSON".
    const rawStream = JSON.parse(encodedChunk)
    const splitAt = rawStream.indexOf('English text') + 4
    const html =
      `<html><script>self.__next_f.push([1,${JSON.stringify(rawStream.slice(0, splitAt))}])</script>` +
      `<script>self.__next_f.push([1,${JSON.stringify(rawStream.slice(splitAt))}])</script></html>`

    const parsed = parseChapterPage(html, 'https://thaqalayn.net/chapter/1/1/0')

    expect(parsed.warnings).toEqual([])
    expect(parsed.hadiths).toHaveLength(1)
    expect(parsed.hadiths[0].text_en).toBe('English text')
  })

  it('tolerates raw control characters inside string literals', () => {
    const rawStream = JSON.parse(encodedChunk).replace('English text', 'English\ttext\nline')
    const html = `<html><script>self.__next_f.push([1,${JSON.stringify(rawStream)}])</script></html>`

    const parsed = parseChapterPage(html, 'https://thaqalayn.net/chapter/1/1/0')

    expect(parsed.hadiths).toHaveLength(1)
    expect(parsed.hadiths[0].text_en).toBe('English\ttext\nline')
  })

  it('returns a parser warning when the hadith payload disappears', () => {
    const parsed = parseChapterPage('<html><script>self.__next_f.push([1,"empty"])</script></html>')

    expect(parsed.hadiths).toHaveLength(0)
    expect(parsed.warnings[0]).toContain('No hadiths')
  })

  it('discovers book and chapter URLs from a sitemap', () => {
    const sitemap = parseSitemap(`
      <urlset>
        <url><loc>https://thaqalayn.net/book/1</loc></url>
        <url><loc>https://thaqalayn.net/chapter/1/1/0</loc></url>
        <url><loc>https://thaqalayn.net/quran/1</loc></url>
      </urlset>
    `)

    expect(sitemap.bookUrls).toEqual(['https://thaqalayn.net/book/1'])
    expect(sitemap.chapterUrls).toEqual(['https://thaqalayn.net/chapter/1/1/0'])
  })

  it('maps website records into legacy-compatible hadiths', () => {
    const legacy = websiteHadithToLegacyShape({
      hadith: {
        number: 3,
        number_by_book: 4,
        text_en: 'English',
        text_ar: 'Arabic',
        gradings: [{ grade_ar: 'لم يخرجه', author: { name_en: 'Shaykh Baqir al-Behbudi' } }],
      },
      meta: {
        bookName: 'Al-Kafi',
        volumeNumber: 1,
        bookSectionNumber: 1,
        chapterNumber: 0,
        chapterName: 'The Book',
      },
      sourceUrl: 'https://thaqalayn.net/chapter/1/1/0',
      legacyRef: { bookId: 'Al-Kafi-Volume-1-Kulayni', id: 4 },
      fallbackBookId: 'fallback',
    })

    expect(legacy.bookId).toBe('Al-Kafi-Volume-1-Kulayni')
    expect(legacy.id).toBe(4)
    expect(legacy.URL).toBe('https://thaqalayn.net/hadith/1/1/0/3')
    expect(legacy.behbudiGrading).toBe('لم يخرجه')
  })
})
