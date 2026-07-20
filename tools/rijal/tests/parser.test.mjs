import { describe, expect, it } from 'vitest'
import {
  extractNarratorIdentityFacts,
  extractNarratorIdentityProfiles,
  parseEntryHeading,
  parseKhoeiVolumes,
} from '../khoei-parser.mjs'

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

  it('extracts authoritative opening identities without indexing biography prose', () => {
    const profiles = extractNarratorIdentityProfiles({
      primaryName: 'محمد بن بحر الرهني',
      aliases: ['محمد بن بحر الرهني'],
      plainText:
        '10324 - محمد بن بحر الرهني :\n\nقال النجاشي : " محمد بن بحر الرهني ( الدهني ) ، أبو الحسين الشيباني : ساكن نرماشين من أرض كرمان " .',
    })

    expect(profiles).toEqual([
      {
        text: 'محمد بن بحر الرهني ( الدهني ) ، أبو الحسين الشيباني',
        normalizedText: 'محمد بن بحر الرهني الدهني ابو الحسين الشيباني',
        source: 'najashi',
      },
    ])
  })

  it('extracts explicit cross-references even when they use a different name', () => {
    const profiles = extractNarratorIdentityProfiles({
      primaryName: 'إبراهيم أبو إسحاق',
      aliases: ['إبراهيم أبو إسحاق'],
      plainText: '48 - إبراهيم أبو إسحاق :\n\n= إبراهيم بن هاشم القمي .\n\nترجمة الراوي .',
    })

    expect(profiles).toEqual([
      {
        text: 'إبراهيم بن هاشم القمي',
        normalizedText: 'ابراهيم بن هاشم القمي',
        source: 'crossReference',
      },
    ])
  })

  it('trims narrative text and rejects a quoted identity for someone else', () => {
    const profiles = extractNarratorIdentityProfiles({
      primaryName: 'حميد بن راشد',
      aliases: ['حميد بن راشد'],
      plainText:
        '4088 - حميد بن راشد :\n\nقال النجاشي : " حميد بن راشد أبو غسان الذهلي ، له كتاب : قاله ابن نوح " .\n\nوقال الشيخ ( 1 ) : " محمد بن سنان أبو جعفر الزاهري : روى عنه " .',
    })

    expect(profiles).toEqual([
      {
        text: 'حميد بن راشد أبو غسان الذهلي',
        normalizedText: 'حميد بن راشد ابو غسان الذهلي',
        source: 'najashi',
      },
    ])
  })

  it('extracts subject-scoped identity facts without indexing chain names', () => {
    const entry = {
      primaryName: 'محمد بن علي بن محمد بن حاتم',
      aliases: ['محمد بن علي بن محمد بن حاتم'],
      textBlocks: [
        { kind: 'heading', text: '11366 - محمد بن علي بن محمد بن حاتم :' },
        { kind: 'ref', text: 'النوفلي : من مشايخ الصدوق .' },
      ],
      plainText:
        '11366 - محمد بن علي بن محمد بن حاتم :\n\nالنوفلي : من مشايخ الصدوق . وقد وصفه بالنوفلي ، وكناه بأبي بكر . وقال : النوفلي ، المعروف بالكرماني . وروى أحمد بن طاهر القمي عنه .',
    }

    expect(extractNarratorIdentityFacts(entry)).toEqual([
      {
        text: 'النوفلي',
        normalizedText: 'النوفلي',
        kind: 'nisba',
        source: 'openingFragment',
      },
      {
        text: 'أبي بكر',
        normalizedText: 'ابي بكر',
        kind: 'kunya',
        source: 'subjectStatement',
      },
      {
        text: 'الكرماني',
        normalizedText: 'الكرماني',
        kind: 'knownAs',
        source: 'subjectStatement',
      },
    ])
    expect(extractNarratorIdentityFacts(entry).some((fact) => fact.text.includes('أحمد'))).toBe(
      false,
    )
  })
})
