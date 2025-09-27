// Test Deepgram API key validity
import fetch from 'node-fetch';

const API_KEY = 'ac3b2dfa6053be0e13aa28f57b0d934b2802f86c';

console.log('🔍 Testing Deepgram API key validity');

try {
  fetch('https://api.deepgram.com/v1/listen?model=nova-2&language=en&smart_format=true', {
    method: 'POST',
    headers: {
      'Authorization': `Token ${API_KEY}`,
      'Content-Type': 'audio/mp3'
    },
    // Empty body just to test auth
    body: Buffer.from('dummy')
  })
  .then(response => {
    console.log('✅ API key validity test:', response.status, response.statusText);
    if (response.status === 400) {
      console.log('✅ API key is valid (400 = invalid request, not auth failure)');
    } else if (response.status === 401) {
      console.log('❌ API key is invalid');
    } else {
      console.log('✅ API key is valid, unexpected response code');
    }
  })
  .catch(err => {
    console.log('❌ Network error testing API key:', err.message);
  });
} catch (err) {
  console.log('❌ Error testing API key:', err.message);
}
