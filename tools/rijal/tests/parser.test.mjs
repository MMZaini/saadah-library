import { describe, expect, it } from 'vitest'
import { parseEntryHeading, parseKhoeiVolumes } from '../khoei-parser.mjs'

function refPage(number, text) {
  return {
    id: String(number),
    number,
    label: String(number),
    contents: [
      {
        id: `ref-${number}`,
        kind: 'ref',
        text: '',
        children: [
          {
            id: `text-${number}`,
            kind: 'text',
            text,
            children: [],
          },
        ],
      },
    ],
  }
}

function textPage(number, text) {
  return {
    id: String(number),
    number,
    label: String(number),
    contents: [{ id: `text-${number}`, kind: 'text', text, children: [] }],
  }
}

function parsePages(pages) {
  return parseKhoeiVolumes([
    {
      volumeNumber: 1,
      book: { id: 'fixture', title: 'معجم رجال الحديث' },
      pages,
      pageCount: pages.length,
    },
  ])
}

describe('Khoei rijal parser', () => {
  it('detects strict numbered narrator headings', () => {
    expect(parseEntryHeading('16 - أبان :')).toMatchObject({
      entryNumber: 16,
      primaryName: 'أبان',
    })
    expect(parseEntryHeading('16 - أبان')).toBeNull()
    expect(parseEntryHeading('136 : الحديث')).toBeNull()
  })

  it('parses adjacent entries on a single page', () => {
    const result = parsePages([
      refPage(10, '1 - أبان :\nالنص الأول .\n2 - إبراهيم بن محمد :\nالنص الثاني .'),
    ])

    expect(result.boundaryErrors).toEqual([])
    expect(result.entries).toHaveLength(2)
    expect(result.entries.map((entry) => entry.primaryName)).toEqual(['أبان', 'إبراهيم بن محمد'])
  })

  it('merges an entry across pages until the next heading', () => {
    const result = parsePages([
      refPage(10, '1 - أبان :\nبداية الترجمة .'),
      refPage(11, 'تتمة الترجمة .'),
      refPage(12, '2 - إبراهيم :\nترجمة أخرى .'),
    ])

    expect(result.entries[0].startPage).toBe(10)
    expect(result.entries[0].endPage).toBe(11)
    expect(result.entries[0].plainText).toContain('تتمة الترجمة')
  })

  it('does not parse numbered intro text when the volume has source ref entries', () => {
    const result = parsePages([
      textPage(1, '1 - هذا تمهيد للكتاب .\n2 - وهذا ليس ترجمة .'),
      refPage(2, '1 - أبان :\nالنص .'),
    ])

    expect(result.entries).toHaveLength(1)
    expect(result.entries[0].primaryName).toBe('أبان')
  })

  it('omits non-unique structured entry numbers while preserving sourceEntryNumber', () => {
    const result = parsePages([
      refPage(10, '1 - أبان :\nالنص الأول .\n1 - إبراهيم :\nالنص الثاني .'),
    ])

    expect(result.entries).toHaveLength(2)
    expect(result.entries.every((entry) => entry.entryNumber === undefined)).toBe(true)
    expect(result.entries.map((entry) => entry.sourceEntryNumber)).toEqual([1, 1])
    expect(new Set(result.entries.map((entry) => entry.id)).size).toBe(2)
  })
})
