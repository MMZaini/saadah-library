console.log('Testing ʿUyūn akhbār al-Riḍā API...')

// First, let's get all books to see what ʿUyūn volumes are available
fetch('https://thaqalayn.net/api/books')
  .then(response => {
    console.log('Books API response status:', response.status)
    return response.json()
  })
  .then(books => {
    console.log('Total books found:', books.length)
    
    // Filter for ʿUyūn akhbār al-Riḍā books
    const uyunBooks = books.filter(book => 
      book.bookId.toLowerCase().includes('uyun') || 
      book.bookId.toLowerCase().includes('rida') ||
      book.bookName.toLowerCase().includes('uyun') ||
      book.bookName.toLowerCase().includes('rida')
    )
    
    console.log('\nʿUyūn akhbār al-Riḍā volumes found:')
    uyunBooks.forEach(book => {
      console.log(`- ID: ${book.bookId}`)
      console.log(`  Name: ${book.bookName}`)
      console.log(`  Cover: ${book.bookCover}`)
      console.log('')
    })
    
    if (uyunBooks.length === 0) {
      console.log('No ʿUyūn akhbār al-Riḍā books found. Let me check similar names...')
      
      // Try to find books with similar patterns
      const similarBooks = books.filter(book => 
        book.bookName.toLowerCase().includes('saduq') ||
        book.bookId.toLowerCase().includes('saduq')
      ).slice(0, 10)
      
      console.log('\nBooks by Saduq found:')
      similarBooks.forEach(book => {
        console.log(`- ID: ${book.bookId}`)
        console.log(`  Name: ${book.bookName}`)
        console.log('')
      })
    }
  })
  .catch(error => {
    console.error('Error:', error)
  })
