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
  { id: 1,  title: 'Al-Kāfi', author: 'Shaykh Muḥammad b. Yaʿqūb al-Kulaynī', image: 'https://thaqalayn.net/css/images/1-round.jpeg', highlighted: true },
  { id: 2, title: 'ʿUyūn akhbār al-Riḍā', author: 'Shaykh Muḥammad b. ʿAlī al-Ṣaduq', image: 'https://thaqalayn.net/css/images/11-round.jpeg' },
  { id: 3,  title: 'Al-Amālī', author: 'Shaykh Muḥammad b. Muḥammad al-Mufīd', image: 'https://thaqalayn.net/css/images/13-round.jpeg' },
  { id: 4,  title: 'Al-Amālī', author: 'Shaykh Muḥammad b. ʿAlī al-Ṣaduq', image: 'https://thaqalayn.net/css/images/29-round.jpeg' },
  { id: 5, title: 'Man Lā Yaḥḍuruh al-Faqīh', author: 'Shaykh Muḥammad b. ʿAlī al-Ṣaduq', image: 'https://thaqalayn.net/css/images/34-round.jpeg', description: 'A jurisprudential collection compiled by Shaykh al-Ṣaduq, covering practical legal rulings and traditions across multiple volumes.' },
  { id: 6, title: 'Al-Tawḥīd', author: 'Shaykh Muḥammad b. ʿAlī al-Ṣaduq', image: 'https://thaqalayn.net/css/images/14-round.jpeg' },
  { id: 7, title: 'Kitāb al-Ghayba', author: 'Abū ʿAbd Allah Muḥammad b. Ibrāhīm al-Nuʿmānī', image: 'https://thaqalayn.net/css/images/22-round.jpeg' },
  { id: 8, title: 'Kitāb al-Ghayba', author: 'Shaykh Muḥammad b. al-Ḥasan al-Ṭūsī', image: 'https://thaqalayn.net/css/images/27-round.jpeg' },
  { id: 9, title: 'Nahj al-Balāgha', author: 'al-Sharīf al-Raḍī', image: 'https://thaqalayn.net/css/images/32-round.jpeg' },
  { id: 10, title: 'Ṣifāt al-Shīʿa', author: 'Shaykh Muḥammad b. ʿAlī al-Ṣaduq', image: 'https://thaqalayn.net/css/images/26-round.jpeg' },
  { id: 11, title: 'Faḍaʾil al-Shīʿa', author: 'Shaykh Muḥammad b. ʿAlī al-Ṣaduq', image: 'https://thaqalayn.net/css/images/25-round.jpeg' },
  { id: 12, title: 'Kitāb al-Muʾmin', author: 'Ḥusayn b. Saʿīd al-Ahwāzī', image: 'https://thaqalayn.net/css/images/30-round.jpeg' },
  { id: 13, title: 'Kitāb al-Zuhd', author: 'Ḥusayn b. Saʿīd al-Ahwāzī', image: 'https://thaqalayn.net/css/images/31-round.jpeg' },
  { id: 14, title: 'Risālat al-Ḥuqūq', author: 'attributed to Imam Zayn al-ʿĀbidīn (a.s)', image: 'https://thaqalayn.net/css/images/33-round.jpeg' },
  { id: 15, title: 'Thawāb al-Aʿmāl wa ʿiqāb al-Aʿmāl', author: 'Shaykh Muḥammad b. ʿAlī al-Ṣaduq', image: 'https://thaqalayn.net/css/images/23-round.jpeg' },
  { id: 16, title: 'Al-Khiṣāl', author: 'Shaykh Muḥammad b. ʿAlī al-Ṣaduq', image: 'https://thaqalayn.net/css/images/10-round.jpeg' },
  { id: 17, title: 'Kāmil al-Ziyārāt', author: 'Shaykh Jaʿfar b. Muḥammad al-Qummī', image: 'https://thaqalayn.net/css/images/24-round.jpeg' },
  { id: 18, title: 'Kitāb al-Ḍuʿafāʾ', author: 'Abū al-Ḥusayn Aḥmad b. al-Ḥusayn al-Ghaḍāʾirī', image: 'https://thaqalayn.net/css/images/17-round.jpeg' },
  { id: 19, title: 'Maʿānī al-ʾAkhbār', author: 'Shaykh Muḥammad b. ʿAlī al-Ṣaduq', image: 'https://thaqalayn.net/css/images/28-round.jpeg' },
  { id: 20, title: 'Muʿjam al-Aḥādīth al-Muʿtabara', author: 'Shaykh Muḥammad Āṣif al-Muḥsinī', image: 'https://thaqalayn.net/css/images/9-round.jpeg' },
]
