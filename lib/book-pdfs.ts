import { withBasePath } from './assets'
import type { SelectedVolume } from './volume-utils'

const PDF_ROOT = '/pdfs/books'

const alKafiPdfByVolume = Object.fromEntries(
  Array.from({ length: 8 }, (_, index) => {
    const volume = index + 1
    return [`Al-Kafi-Volume-${volume}-Kulayni`, `${PDF_ROOT}/al-kafi/volume-${volume}.pdf`]
  }),
)

const uyunPdfByVolume = Object.fromEntries(
  Array.from({ length: 2 }, (_, index) => {
    const volume = index + 1
    return [
      `Uyun-akhbar-al-Rida-Volume-${volume}-Saduq`,
      `${PDF_ROOT}/uyun-akhbar-al-rida/volume-${volume}.pdf`,
    ]
  }),
)

const faqihPdfByVolume = Object.fromEntries(
  Array.from({ length: 4 }, (_, index) => {
    const volume = index + 1
    return [
      `Man-La-Yahduruh-al-Faqih-Volume-${volume}-Saduq`,
      `${PDF_ROOT}/man-la-yahduruh-al-faqih/volume-${volume}.pdf`,
    ]
  }),
)

export const PDF_PATHS_BY_VOLUME_ID: Record<string, string> = {
  ...alKafiPdfByVolume,
  ...uyunPdfByVolume,
  ...faqihPdfByVolume,
  'Al-Amali-Mufid': `${PDF_ROOT}/al-amali-mufid/single-volume.pdf`,
  'Al-Amali-Saduq': `${PDF_ROOT}/al-amali-saduq/single-volume.pdf`,
  'Al-Tawhid-Saduq': `${PDF_ROOT}/al-tawhid/single-volume.pdf`,
  'Kitab-al-Ghayba-Numani': `${PDF_ROOT}/kitab-al-ghayba-numani/single-volume.pdf`,
  'Kitab-al-Ghayba-Tusi': `${PDF_ROOT}/kitab-al-ghayba-tusi/single-volume.pdf`,
  'Nahj-al-Balagha-Radi': `${PDF_ROOT}/nahj-al-balagha/single-volume.pdf`,
  'Sifat-al-Shia-Saduq': `${PDF_ROOT}/sifat-al-shia/single-volume.pdf`,
  'Fadail-al-Shia-Saduq': `${PDF_ROOT}/fadail-al-shia/single-volume.pdf`,
  'Kitab-al-Mumin-Ahwazi': `${PDF_ROOT}/kitab-al-mumin/single-volume.pdf`,
  'Kitab-al-Zuhd-Ahwazi': `${PDF_ROOT}/kitab-al-zuhd/single-volume.pdf`,
  'Risalat-al-Huquq-Abidin': `${PDF_ROOT}/risalat-al-huquq/single-volume.pdf`,
  'Thawab-al-Amal-wa-iqab-al-Amal-Saduq': `${PDF_ROOT}/thawab-al-amal-wa-iqab-al-amal/volume-1.pdf`,
  'Al-Khisal-Saduq': `${PDF_ROOT}/al-khisal/volume-1.pdf`,
  'Kamil-al-Ziyarat-Qummi': `${PDF_ROOT}/kamil-al-ziyarat/single-volume.pdf`,
  'Kitab-al-Duafa-Ghadairi': `${PDF_ROOT}/kitab-al-duafa/single-volume.pdf`,
  'Maani-al-Akhbar-Saduq': `${PDF_ROOT}/maani-al-akhbar/volume-1.pdf`,
  'Mujam-al-Ahadith-al-Mutabara-Muhsini': `${PDF_ROOT}/mujam-al-ahadith-al-mutabara/volume-1.pdf`,
}

export const EXTRA_BOOK_PDF_PATHS: Record<string, readonly string[]> = {
  'Al-Khisal-Saduq': [`${PDF_ROOT}/al-khisal/volume-2.pdf`, `${PDF_ROOT}/al-khisal/volume-3.pdf`],
  'Maani-al-Akhbar-Saduq': [`${PDF_ROOT}/maani-al-akhbar/volume-2.pdf`],
  'Thawab-al-Amal-wa-iqab-al-Amal-Saduq': [
    `${PDF_ROOT}/thawab-al-amal-wa-iqab-al-amal/volume-2.pdf`,
  ],
  'Mujam-al-Ahadith-al-Mutabara-Muhsini': Array.from(
    { length: 7 },
    (_, index) => `${PDF_ROOT}/mujam-al-ahadith-al-mutabara/volume-${index + 2}.pdf`,
  ),
  'Uyun-akhbar-al-Rida': [`${PDF_ROOT}/uyun-akhbar-al-rida/volume-3.pdf`],
  'Uyun-akhbar-al-Rida-Volume-1-Saduq': [`${PDF_ROOT}/uyun-akhbar-al-rida/volume-3.pdf`],
}

const DEFAULT_VOLUME_BY_BOOK_ID: Record<string, string> = {
  'Al-Kafi': 'Al-Kafi-Volume-1-Kulayni',
  'Uyun-akhbar-al-Rida': 'Uyun-akhbar-al-Rida-Volume-1-Saduq',
  'Man-La-Yahduruh-al-Faqih': 'Man-La-Yahduruh-al-Faqih-Volume-1-Saduq',
}

export function resolvePdfVolumeId(
  bookId: string | null | undefined,
  selectedVolume: SelectedVolume | null | undefined,
): string | null {
  if (selectedVolume && selectedVolume !== 'all') {
    const selected = String(selectedVolume)
    if (PDF_PATHS_BY_VOLUME_ID[selected]) return selected

    const volumeNumber = Number(selected)
    if (Number.isFinite(volumeNumber)) {
      if (bookId?.startsWith('Al-Kafi')) return `Al-Kafi-Volume-${volumeNumber}-Kulayni`
      if (bookId?.startsWith('Uyun-akhbar-al-Rida')) {
        return `Uyun-akhbar-al-Rida-Volume-${volumeNumber}-Saduq`
      }
      if (bookId?.startsWith('Man-La-Yahduruh-al-Faqih')) {
        return `Man-La-Yahduruh-al-Faqih-Volume-${volumeNumber}-Saduq`
      }
    }
  }

  if (!bookId) return null
  if (PDF_PATHS_BY_VOLUME_ID[bookId]) return bookId
  return DEFAULT_VOLUME_BY_BOOK_ID[bookId] ?? null
}

export function getPdfPathForVolume(
  bookId: string | null | undefined,
  selectedVolume: SelectedVolume | null | undefined,
): string | null {
  const volumeId = resolvePdfVolumeId(bookId, selectedVolume)
  return volumeId ? (PDF_PATHS_BY_VOLUME_ID[volumeId] ?? null) : null
}

export function getPdfUrlForVolume(
  bookId: string | null | undefined,
  selectedVolume: SelectedVolume | null | undefined,
): string | null {
  const path = getPdfPathForVolume(bookId, selectedVolume)
  return path ? withBasePath(path) : null
}

export function getAllKnownPdfPaths(): string[] {
  return Array.from(
    new Set([
      ...Object.values(PDF_PATHS_BY_VOLUME_ID),
      ...Object.values(EXTRA_BOOK_PDF_PATHS).flat(),
    ]),
  )
}
