'use client'

import HadithCard from '@/components/HadithCard'

const mockHadiths = [
  {
    _id: 'test-123',
    id: 1234,
    bookId: 'Al-Kafi-Volume-1-Kulayni',
    book: 'Al-Kafi',
    category: 'Test Category',
    categoryId: 'test-category',
    chapter: 'Test Chapter',
    author: 'Test Author',
    translator: 'Test Translator',
    englishText: 'This is a test hadith with chapterInCategoryId = 5.',
    arabicText: 'هذا حديث تجريبي',
    majlisiGrading: 'Sahih',
    URL: 'https://example.com',
    volume: 1,
    frenchText: '',
    mohseniGrading: 'Sahih',
    behbudiGrading: 'Sahih',
    chapterInCategoryId: 5,
    thaqalaynSanad: '',
    thaqalaynMatn: 'This is a test hadith with chapterInCategoryId = 5.',
    gradingsFull: [],
    __v: 0
  },
  {
    _id: 'test-456',
    id: 5678,
    bookId: 'Al-Kafi-Volume-1-Kulayni',
    book: 'Al-Kafi',
    category: 'Test Category 2',
    categoryId: 'test-category-2',
    chapter: 'Test Chapter 2',
    author: 'Test Author',
    translator: 'Test Translator',
    englishText: 'This is a test hadith with chapterInCategoryId = 0.',
    arabicText: 'هذا حديث تجريبي آخر',
    majlisiGrading: 'Sahih',
    URL: 'https://example.com',
    volume: 1,
    frenchText: '',
    mohseniGrading: 'Sahih',
    behbudiGrading: 'Sahih',
    chapterInCategoryId: 0,
    thaqalaynSanad: '',
    thaqalaynMatn: 'This is a test hadith with chapterInCategoryId = 0.',
    gradingsFull: [],
    __v: 0
  }
]

export default function TestPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <h1 className="text-2xl font-bold mb-8">Test Page - View Chapter Button</h1>
      
      <div className="space-y-8">
        <div>
          <h2 className="text-lg font-semibold mb-4">With showViewChapter={true} and chapterInCategoryId=5:</h2>
          <HadithCard hadith={mockHadiths[0]} showViewChapter={true} />
        </div>
        
        <div>
          <h2 className="text-lg font-semibold mb-4">With showViewChapter={true} and chapterInCategoryId=0:</h2>
          <HadithCard hadith={mockHadiths[1]} showViewChapter={true} />
        </div>
        
        <div>
          <h2 className="text-lg font-semibold mb-4">With showViewChapter={false}:</h2>
          <HadithCard hadith={mockHadiths[0]} showViewChapter={false} />
        </div>
      </div>
    </div>
  )
}
