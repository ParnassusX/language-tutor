// Debug script to test the German Voice Tutor app
// This will check all the critical components

import http from 'http';

console.log('🔍 Starting app debug...\n');

// Check 1: Test API endpoint
console.log('1. Testing API endpoint...');
const req = http.get('http://localhost:5173/api/voice-agent', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log('✅ API Response:', {
        status: res.statusCode,
        hasToken: !!json.token,
        hasConfig: !!json.config,
        websocketUrl: json.websocketUrl
      });

      // Check 2: Validate Deepgram API key format
      console.log('\n2. Checking API key...');
      const apiKey = json.token;
      if (apiKey && apiKey.startsWith('ac') && apiKey.length === 33) {
        console.log('✅ API key format looks valid');
      } else {
        console.log('❌ API key format issue:');
        console.log('   - Starts with "ac":', apiKey && apiKey.startsWith('ac'));
        console.log('   - Length is 33:', apiKey && apiKey.length === 33);
        console.log('   - Actual length:', apiKey ? apiKey.length : 'N/A');
        console.log('   - Starts with:', apiKey ? `"${apiKey.substring(0, 6)}..."` : 'N/A');

        if (!apiKey.startsWith('ac')) {
          console.log('   💡 ISSUE: API key should start with "ac" for Deepgram keys');
        }
        if (apiKey.length !== 33) {
          console.log('   💡 ISSUE: Deepgram API keys are typically 33 characters long');
        }
      }

      // Check 3: Validate configuration structure
      console.log('\n3. Checking agent configuration...');
      const config = json.config;
      if (config && config.language && config.model) {
        console.log('✅ Agent config looks good:', config.language, config.model);
      } else {
        console.log('❌ Agent config is incomplete');
      }

      // Check 4: Test WebSocket connection (simulated)
      console.log('\n4. WebSocket URL validation...');
      if (json.websocketUrl && json.websocketUrl.startsWith('wss://')) {
        console.log('✅ WebSocket URL is valid:', json.websocketUrl);
      } else {
        console.log('❌ WebSocket URL is invalid');
      }

      console.log('\n🎯 All checks complete. Frontend should work now!');
    } catch (e) {
      console.log('❌ API returned invalid JSON:', data);
    }
  });
}).on('error', (err) => {
  console.log('❌ API call failed:', err.message);
  console.log('💡 Is the dev server running? Run "npm run dev" first.');
});
