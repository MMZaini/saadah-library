import { describe, it, expect } from 'vitest'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { stripArabicFootnoteMarkers, stripEnglishFootnoteMarkers } from '@/lib/footnote-markers'

// Sample texts below are taken verbatim from the current dataset release so
// the rules stay anchored to real content, not invented fixtures.

describe('stripArabicFootnoteMarkers', () => {
  it('removes a trailing footnote marker (Al-Amali-Saduq #651)', () => {
    expect(stripArabicFootnoteMarkers('واحفظوا ألسنتكم وكفوها عن الفضول وقبيح القول (2).')).toBe(
      'واحفظوا ألسنتكم وكفوها عن الفضول وقبيح القول.',
    )
  })

  it('removes a mid-text footnote marker without joining words (Al-Amali-Saduq #1)', () => {
    expect(stripArabicFootnoteMarkers('فما لي أراك نصبا (1)؟ قال: حبك أنصبني.')).toBe(
      'فما لي أراك نصبا؟ قال: حبك أنصبني.',
    )
  })

  it('removes sequential per-verse footnote markers (Al-Amali-Saduq #29)', () => {
    const text =
      '(حسبنا الله ونعم الوكيل) (1)! فإني سمعت الله عز وجل يقول بعقبها: (فانقلبوا بنعمة من الله وفضل لم يمسسهم سوء) (2)،'
    expect(stripArabicFootnoteMarkers(text)).toBe(
      '(حسبنا الله ونعم الوكيل)! فإني سمعت الله عز وجل يقول بعقبها: (فانقلبوا بنعمة من الله وفضل لم يمسسهم سوء)،',
    )
  })

  it('removes Arabic-Indic digit markers (Al-Tawhid-Saduq #41)', () => {
    expect(stripArabicFootnoteMarkers('صفته فتقول: متى؟ (١) ولا بدئ مما')).toBe(
      'صفته فتقول: متى؟ ولا بدئ مما',
    )
  })

  it('preserves 3-digit Quranic ayah numbers (Al-Khisal-Saduq #1232)', () => {
    const text = 'لايَاتٍ لأُِولِي الْأَلْبَابِ (190) الَّذِينَ يَذْكُرُونَ اللَّهَ'
    expect(stripArabicFootnoteMarkers(text)).toBe(text)
  })

  it('preserves brace-delimited ayah numbers (Kitab-al-Ghayba-Numani #15)', () => {
    const text = 'وَسَيَجْزِي اللَّهُ الشَّاكِرِينَ {144} لَا تَجْعَلُوا دُعَاءَ الرَّسُولِ'
    expect(stripArabicFootnoteMarkers(text)).toBe(text)
  })

  it('removes asterisk markers (Al-Tawhid-Saduq #38)', () => {
    expect(stripArabicFootnoteMarkers('مولى لهم وخالا (*) لبعضهم')).toBe('مولى لهم وخالا لبعضهم')
  })

  it('removes bracketed markers (Mujam #548)', () => {
    expect(stripArabicFootnoteMarkers('نقص السورتين من القرآن‌[1] و بحثه')).toBe(
      'نقص السورتين من القرآن‌ و بحثه',
    )
  })

  it('keeps the leading hadith number untouched', () => {
    expect(stripArabicFootnoteMarkers('17 - حدثنا الحسين بن إبراهيم (2).')).toBe(
      '17 - حدثنا الحسين بن إبراهيم.',
    )
  })

  it('does not eat newlines around markers', () => {
    expect(stripArabicFootnoteMarkers('سطر أول (1)\nسطر ثان')).toBe('سطر أول\nسطر ثان')
  })

  it('folds Persian code points that the display font cannot render', () => {
    // Farsi yeh (ی) and keheh (ک) fold to Arabic yeh/kaf; the sentence stays
    // otherwise identical (Thawab al-Amal #105).
    expect(stripArabicFootnoteMarkers('مَنْ قَالَ رَضِیتُ بِاللَّهِ رَبّاً کَانَ حَقّاً')).toBe(
      'مَنْ قَالَ رَضِيتُ بِاللَّهِ رَبّاً كَانَ حَقّاً',
    )
  })

  it('strips a Persian-digit footnote marker after folding it (۲ → ٢)', () => {
    expect(stripArabicFootnoteMarkers('قول (۲) نص')).toBe('قول نص')
  })

  it('is idempotent and passes through empty/undefined', () => {
    const once = stripArabicFootnoteMarkers('قول (2). نص رَضِیتُ')
    expect(stripArabicFootnoteMarkers(once)).toBe(once)
    expect(stripArabicFootnoteMarkers(undefined)).toBeUndefined()
    expect(stripArabicFootnoteMarkers('')).toBe('')
  })
})

describe('stripEnglishFootnoteMarkers', () => {
  it('removes trailing bracket footnotes (Al-Khisal-Saduq #460)', () => {
    expect(stripEnglishFootnoteMarkers('And praying lights up my eyes.”[1]')).toBe(
      'And praying lights up my eyes.”',
    )
  })

  it('removes mid-text bracket footnotes (Maani-al-Akhbar #71)', () => {
    expect(stripEnglishFootnoteMarkers('the «Alif» is the Bounties [1] of Allah')).toBe(
      'the «Alif» is the Bounties of Allah',
    )
  })

  it('removes multi-digit bracket footnotes (Maani-al-Akhbar #47)', () => {
    expect(stripEnglishFootnoteMarkers('it is a river [46] in Paradise')).toBe(
      'it is a river in Paradise',
    )
  })

  it('preserves parenthesized enumerations (Al-Amali-Saduq #18)', () => {
    const text =
      'The readers of the Quran are of three types: (1) One is a man who has learned the Quran'
    expect(stripEnglishFootnoteMarkers(text)).toBe(text)
  })

  it('preserves Quran references and ranges', () => {
    const refs =
      'fear Allah alone.’ (35:28) and (2:167). Days: (2) the tenth, (3-5) three days of al-Tashriq'
    expect(stripEnglishFootnoteMarkers(refs)).toBe(refs)
  })

  it('preserves the hadith number at the start of a sanad (Kitab-al-Ghayba-Numani)', () => {
    const text = '(1) Abul Abbas Ahmad bin Muhammad bin Sa’id bin Uqda narrated'
    expect(stripEnglishFootnoteMarkers(text)).toBe(text)
  })

  it('removes stray superscript markers (Al-Kafi V5 #1398)', () => {
    expect(stripEnglishFootnoteMarkers('from Mas’adah b. Ziyad ¹  from Abu Abdillah (as)')).toBe(
      'from Mas’adah b. Ziyad from Abu Abdillah (as)',
    )
  })

  it('is idempotent and passes through empty/undefined', () => {
    const once = stripEnglishFootnoteMarkers('text.[1] More')
    expect(stripEnglishFootnoteMarkers(once)).toBe(once)
    expect(stripEnglishFootnoteMarkers(undefined)).toBeUndefined()
    expect(stripEnglishFootnoteMarkers('')).toBe('')
  })
})

describe('against the real dataset', () => {
  it('cleans every Arabic footnote marker and keeps all English Quran references', async () => {
    const root = process.cwd()
    const manifest = JSON.parse(
      await readFile(path.join(root, 'public/data/thaqalayn/current/manifest.json'), 'utf8'),
    )
    const volume = async (bookId: string) =>
      JSON.parse(
        await readFile(
          path.join(
            root,
            'public/data/thaqalayn',
            manifest.version,
            'runtime/volumes',
            `${bookId}.json`,
          ),
          'utf8',
        ),
      ) as Array<{ arabicText?: string; englishText?: string; thaqalaynMatn?: string }>

    const hadiths = [
      ...(await volume('Al-Amali-Saduq')),
      ...(await volume('Al-Tawhid-Saduq')),
      ...(await volume('Al-Khisal-Saduq')),
      // The book that carries the Persian-code-point mis-encodings.
      ...(await volume('Thawab-al-Amal-wa-iqab-al-Amal-Saduq')),
    ]

    const quranRef = /\(\s*\d{1,3}\s*:\s*\d{1,3}\s*\)/g
    for (const h of hadiths) {
      if (h.arabicText) {
        const cleaned = stripArabicFootnoteMarkers(h.arabicText)
        // No 1–2 digit paren/bracket markers survive…
        expect(cleaned).not.toMatch(/\(\s*[\d٠-٩]{1,2}\s*\)/)
        expect(cleaned).not.toMatch(/\[\s*\d{1,3}\s*\]/)
        // …and no non-standard connecting letters that the display font renders
        // as broken glyphs (Farsi yeh, keheh, swash kaf, heh doachashmee/goal).
        expect(cleaned).not.toMatch(/[یکڪھہ]/)
      }
      for (const text of [h.englishText, h.thaqalaynMatn]) {
        if (!text) continue
        const cleaned = stripEnglishFootnoteMarkers(text)
        // …while every Quran reference survives verbatim.
        expect(cleaned.match(quranRef)?.length ?? 0).toBe(text.match(quranRef)?.length ?? 0)
        expect(cleaned).not.toMatch(/\[\s*\d{1,3}\s*\]/)
      }
    }
  })
})
