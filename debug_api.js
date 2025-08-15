console.log('Testing ʿUyūn akhbār al-Riḍā API...')

// First, let's get all books to see what the response structure is
fetch('https://thaqalayn.net/api/books')
  .then(response => {
    console.log('Books API response status:', response.status)
    return response.json()
  })
  .then(data => {
    console.log('API Response structure:', typeof data)
    console.log('Keys:', Object.keys(data))
    console.log('Full response:', JSON.stringify(data, null, 2).slice(0, 500) + '...')
  })
  .catch(error => {
    console.error('Error:', error)
  })
