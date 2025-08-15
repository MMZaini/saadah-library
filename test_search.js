import fetch from 'node-fetch';

async function testSearch() {
  try {
    const response = await fetch('https://www.thaqalayn-api.net/api/v2/search/all?query=imam&limit=5');
    const data = await response.json();
    
    console.log('API Response Status:', response.status);
    console.log('Number of results:', data.results ? data.results.length : 0);
    
    if (data.results && data.results.length > 0) {
      const firstResult = data.results[0];
      console.log('First result fields:');
      console.log('- volume:', firstResult.volume);
      console.log('- categoryId:', firstResult.categoryId);
      console.log('- chapterInCategoryId:', firstResult.chapterInCategoryId);
      console.log('- id:', firstResult.id);
      console.log('- book:', firstResult.book);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testSearch();
