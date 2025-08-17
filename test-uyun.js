// Test script to check ʿUyūn akhbār al-Riḍā API calls
const testUyunApi = async () => {
  const BASE_URL = 'https://www.thaqalayn-api.net/api/v2';
  
  console.log('Testing API calls...')
  
  // Test Al-Kafi first (known working)
  try {
    const responseKafi = await fetch(`${BASE_URL}/Al-Kafi-Volume-1-Kulayni`)
    console.log('Al-Kafi Volume 1 response status:', responseKafi.status)
    
    if (responseKafi.ok) {
      const dataKafi = await responseKafi.json()
      console.log('Al-Kafi hadiths count:', dataKafi.length || 0)
      if (dataKafi.length > 0) {
        console.log('First few Al-Kafi hadith IDs:', dataKafi.slice(0, 5).map(h => h.id))
      }
    }
  } catch (err) {
    console.error('Al-Kafi fetch error:', err)
  }
  
  // Test volume 1
  try {
    const response1 = await fetch(`${BASE_URL}/Uyun-akhbar-al-Rida-Volume-1-Saduq`)
    console.log('ʿUyūn Volume 1 response status:', response1.status)
    
    if (response1.ok) {
      const data1 = await response1.json()
      console.log('ʿUyūn Volume 1 hadiths count:', data1.length || 0)
      if (data1.length > 0) {
        console.log('First few ʿUyūn V1 hadith IDs:', data1.slice(0, 5).map(h => h.id))
      }
    } else {
      console.log('ʿUyūn Volume 1 error:', response1.statusText)
    }
  } catch (err) {
    console.error('ʿUyūn Volume 1 fetch error:', err)
  }
  
  // Test volume 2
  try {
    const response2 = await fetch(`${BASE_URL}/Uyun-akhbar-al-Rida-Volume-2-Saduq`)
    console.log('ʿUyūn Volume 2 response status:', response2.status)
    
    if (response2.ok) {
      const data2 = await response2.json()
      console.log('ʿUyūn Volume 2 hadiths count:', data2.length || 0)
      if (data2.length > 0) {
        console.log('First few ʿUyūn V2 hadith IDs:', data2.slice(0, 5).map(h => h.id))
      }
    } else {
      console.log('ʿUyūn Volume 2 error:', response2.statusText)
    }
  } catch (err) {
    console.error('ʿUyūn Volume 2 fetch error:', err)
  }
  
  // Test volume 2
  try {
    const response2 = await fetch(`${BASE_URL}/books/Uyun-akhbar-al-Rida-Volume-2-Saduq/hadiths`)
    console.log('Volume 2 response status:', response2.status)
    
    if (response2.ok) {
      const data2 = await response2.json()
      console.log('Volume 2 hadiths count:', data2.hadiths?.length || 0)
      if (data2.hadiths?.length > 0) {
        console.log('First few hadith IDs:', data2.hadiths.slice(0, 5).map(h => h.id))
      }
    } else {
      console.log('Volume 2 error:', response2.statusText)
    }
  } catch (err) {
    console.error('Volume 2 fetch error:', err)
  }
}

testUyunApi()
