console.log('Testing ʿUyūn akhbār al-Riḍā API...')

// First, let's get all books to see what ʿUyūn volumes are available
fetch('https://thaqalayn.net/api/books')
  .then(response => {
    console.log('Books API response status:', response.status)
    return response.json()
  })
  .then(data => {
    const books = data.books
    console.log('Total books found:', books.length)
    
    // Filter for ʿUyūn akhbār al-Riḍā books
    const uyunBooks = books.filter(book => 
      book.name.toLowerCase().includes('uyun') || 
      book.name.toLowerCase().includes('rida') ||
      book.name.toLowerCase().includes('riḍā') ||
      book.alt_title?.toLowerCase().includes('uyun') ||
      book.alt_title?.toLowerCase().includes('rida')
    )
    
    console.log('\nʿUyūn akhbār al-Riḍā volumes found:')
    uyunBooks.forEach(book => {
      console.log(`- ID: ${book.id}`)
      console.log(`  Name: ${book.name}`)
      console.log(`  Alt Title: ${book.alt_title}`)
      console.log(`  Author: ${book.author}`)
      console.log('')
    })
    
    if (uyunBooks.length === 0) {
      console.log('No ʿUyūn akhbār al-Riḍā books found. Let me check books by Saduq...')
      
      // Try to find books by al-Saduq
      const saduqBooks = books.filter(book => 
        book.author.toLowerCase().includes('saduq') ||
        book.name.toLowerCase().includes('saduq')
      )
      
      console.log('\nBooks by Saduq found:')
      saduqBooks.forEach(book => {
        console.log(`- ID: ${book.id}`)
        console.log(`  Name: ${book.name}`)
        console.log(`  Alt Title: ${book.alt_title}`)
        console.log('')
      })
    }
  })
  .catch(error => {
    console.error('Error:', error)
  })
