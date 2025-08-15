console.log('Testing fetch availability...')
console.log('fetch function:', typeof fetch)

// Test if we're in a Node.js environment where fetch might not be available
if (typeof fetch === 'undefined') {
  console.log('Fetch not available in this environment')
} else {
  console.log('Fetch is available, testing API...')
  
  fetch('https://www.thaqalayn-api.net/api/v2/search/all?query=imam&limit=2')
    .then(response => {
      console.log('Response status:', response.status)
      return response.json()
    })
    .then(data => {
      console.log('Response data:', JSON.stringify(data, null, 2))
    })
    .catch(error => {
      console.error('Error:', error)
    })
}
