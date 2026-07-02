export type Book = {
  id: number
  title: string
  subtitle?: string
  author?: string
  image: string
  description?: string
  highlighted?: boolean
}

export const books: Book[] = [
  {
    id: 1,
    title: 'Al-Kāfi',
    author: 'Shaykh Muḥammad b. Yaʿqūb al-Kulaynī',
    image: '/covers/1-round.jpeg',
    highlighted: true,
  },
  {
    id: 2,
    title: 'ʿUyūn akhbār al-Riḍā',
    author: 'Shaykh Muḥammad b. ʿAlī al-Ṣaduq',
    image: '/covers/11-round.jpeg',
  },
  {
    id: 3,
    title: 'Al-Amālī',
    subtitle: 'The Dictations (al-Mufīd)',
    author: 'Shaykh Muḥammad b. Muḥammad al-Mufīd',
    image: '/covers/13-round.jpeg',
  },
  {
    id: 4,
    title: 'Al-Amālī',
    subtitle: 'The Dictations (al-Ṣadūq)',
    author: 'Shaykh Muḥammad b. ʿAlī al-Ṣaduq',
    image: '/covers/29-round.jpeg',
  },
  {
    id: 5,
    title: 'Man Lā Yaḥḍuruh al-Faqīh',
    author: 'Shaykh Muḥammad b. ʿAlī al-Ṣaduq',
    image: '/covers/34-round.jpeg',
    description:
      'A jurisprudential collection compiled by Shaykh al-Ṣaduq, covering practical legal rulings and traditions across multiple volumes.',
  },
  {
    id: 6,
    title: 'Al-Tawḥīd',
    author: 'Shaykh Muḥammad b. ʿAlī al-Ṣaduq',
    image: '/covers/14-round.jpeg',
  },
  {
    id: 7,
    title: 'Kitāb al-Ghayba',
    author: 'Abū ʿAbd Allah Muḥammad b. Ibrāhīm al-Nuʿmānī',
    image: '/covers/22-round.jpeg',
  },
  {
    id: 8,
    title: 'Kitāb al-Ghayba',
    author: 'Shaykh Muḥammad b. al-Ḥasan al-Ṭūsī',
    image: '/covers/27-round.jpeg',
  },
  {
    id: 9,
    title: 'Nahj al-Balāgha',
    author: 'al-Sharīf al-Raḍī',
    image: '/covers/32-round.jpeg',
  },
  {
    id: 10,
    title: 'Ṣifāt al-Shīʿa',
    author: 'Shaykh Muḥammad b. ʿAlī al-Ṣaduq',
    image: '/covers/26-round.jpeg',
  },
  {
    id: 11,
    title: 'Faḍaʾil al-Shīʿa',
    author: 'Shaykh Muḥammad b. ʿAlī al-Ṣaduq',
    image: '/covers/25-round.jpeg',
  },
  {
    id: 12,
    title: 'Kitāb al-Muʾmin',
    author: 'Ḥusayn b. Saʿīd al-Ahwāzī',
    image: '/covers/30-round.jpeg',
  },
  {
    id: 13,
    title: 'Kitāb al-Zuhd',
    author: 'Ḥusayn b. Saʿīd al-Ahwāzī',
    image: '/covers/31-round.jpeg',
  },
  {
    id: 14,
    title: 'Risālat al-Ḥuqūq',
    author: 'attributed to Imam Zayn al-ʿĀbidīn (a.s)',
    image: '/covers/33-round.jpeg',
  },
  {
    id: 15,
    title: 'Thawāb al-Aʿmāl wa ʿiqāb al-Aʿmāl',
    author: 'Shaykh Muḥammad b. ʿAlī al-Ṣaduq',
    image: '/covers/23-round.jpeg',
  },
  {
    id: 16,
    title: 'Al-Khiṣāl',
    author: 'Shaykh Muḥammad b. ʿAlī al-Ṣaduq',
    image: '/covers/10-round.jpeg',
  },
  {
    id: 17,
    title: 'Kāmil al-Ziyārāt',
    author: 'Shaykh Jaʿfar b. Muḥammad al-Qummī',
    image: '/covers/24-round.jpeg',
  },
  {
    id: 18,
    title: 'Kitāb al-Ḍuʿafāʾ',
    author: 'Abū al-Ḥusayn Aḥmad b. al-Ḥusayn al-Ghaḍāʾirī',
    image: '/covers/17-round.jpeg',
  },
  {
    id: 19,
    title: 'Maʿānī al-ʾAkhbār',
    author: 'Shaykh Muḥammad b. ʿAlī al-Ṣaduq',
    image: '/covers/28-round.jpeg',
  },
  {
    id: 20,
    title: 'Muʿjam al-Aḥādīth al-Muʿtabara',
    author: 'Shaykh Muḥammad Āṣif al-Muḥsinī',
    image: '/covers/9-round.jpeg',
  },
  {
    id: 21,
    title: 'Kamāl al-Dīn wa Tamām al-Niʿma',
    subtitle: 'The Perfection of the Religion',
    author: 'Shaykh Muḥammad b. ʿAlī al-Ṣaduq',
    image: '/covers/39-round.jpeg',
  },
]

// Maps a homepage `books` numeric id to the dataset bookId used for routing and
// asset lookup. Single source of truth — consumed by BookCard and the /scans
// source list (lib/scan-sources.ts). For multi-volume books this points at the
// book's primary volume / base id.
export const BOOK_ID_BY_NUMERIC_ID: Record<number, string> = {
  1: 'Al-Kafi-Volume-1-Kulayni',
  2: 'Uyun-akhbar-al-Rida-Volume-1-Saduq',
  3: 'Al-Amali-Mufid',
  4: 'Al-Amali-Saduq',
  5: 'Man-La-Yahduruh-al-Faqih',
  6: 'Al-Tawhid-Saduq',
  7: 'Kitab-al-Ghayba-Numani',
  8: 'Kitab-al-Ghayba-Tusi',
  9: 'Nahj-al-Balagha-Radi',
  10: 'Sifat-al-Shia-Saduq',
  11: 'Fadail-al-Shia-Saduq',
  12: 'Kitab-al-Mumin-Ahwazi',
  13: 'Kitab-al-Zuhd-Ahwazi',
  14: 'Risalat-al-Huquq-Abidin',
  15: 'Thawab-al-Amal-wa-iqab-al-Amal-Saduq',
  16: 'Al-Khisal-Saduq',
  17: 'Kamil-al-Ziyarat-Qummi',
  18: 'Kitab-al-Duafa-Ghadairi',
  19: 'Maani-al-Akhbar-Saduq',
  20: 'Mujam-al-Ahadith-al-Mutabara-Muhsini',
  21: 'Kamal-al-Din-wa-Tamam-al-Nima-Saduq',
}

const coverByBookId: Record<string, string> = Object.fromEntries(
  books
    .map((b) => [BOOK_ID_BY_NUMERIC_ID[b.id], b.image] as const)
    .filter(([bookId]) => Boolean(bookId)),
)

// Round cover image path for a dataset bookId, if one is known.
export function getCoverForBookId(bookId: string): string | undefined {
  return coverByBookId[bookId]
}
