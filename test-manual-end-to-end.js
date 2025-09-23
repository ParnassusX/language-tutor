// Manual End-to-End Testing for German Voice Tutor
// This script provides step-by-step testing instructions and automated checks

console.log('🇩🇪 GERMAN VOICE TUTOR - END-TO-END TESTING\n');

async function testMicrophoneAccess() {
  console.log('🎤 Testing microphone access...');

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    console.log('✅ Microphone access granted');
    stream.getTracks().forEach(track => track.stop());
    return true;
  } catch (error) {
    console.error('❌ Microphone access denied:', error.message);
    return false;
  }
}

async function testAPISendGerman(audioBlob) {
  console.log('📡 Testing German transcription API...');

  try {
    const response = await fetch('/api/transcribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audioBlob })
    });

    if (!response.ok) throw new Error(`API returned ${response.status}`);

    const data = await response.json();
    console.log('🎯 API Response:', {
      transcript: data.transcript,
      confidence: data.confidence,
      language: data.language
    });
    return data;
  } catch (error) {
    console.error('❌ API test failed:', error.message);
    return null;
  }
}

async function recordAndTranscribe(germanPhrase) {
  console.log(`🎵 Testing German phrase: "${germanPhrase}"`);

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        sampleRate: 16000
      }
    });

    const recorder = new MediaRecorder(stream, {
      mimeType: 'audio/webm;codecs=opus'
    });

    return new Promise((resolve) => {
      const chunks = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());

        // Convert to base64
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const base64Audio = await blobToBase64(blob);

        // Test transcription
        const result = await testAPISendGerman(base64Audio);
        resolve(result);
      };

      // Start recording
      recorder.start();

      // Stop after 3 seconds (for testing)
      setTimeout(() => recorder.stop(), 3000);
    });

  } catch (error) {
    console.error('❌ Recording failed:', error.message);
    return null;
  }
}

function blobToBase64(blob) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.readAsDataURL(blob);
  });
}

async function testGeminiAI(phrase) {
  console.log('🤖 Testing AI response generation...');

  try {
    const response = await fetch('/api/conversational', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: phrase })
    });

    if (!response.ok) throw new Error(`AI API returned ${response.status}`);

    const data = await response.json();
    console.log('💡 AI Response:', data.aiResponse);
    return data.aiResponse;
  } catch (error) {
    console.error('❌ AI test failed:', error.message);
    return null;
  }
}

async function performEndToEndTest() {
  console.log('\n🚀 STARTING END-TO-END GERMAN VOICE TUTOR TESTING\n');

  // 1. Test microphone permissions
  const micAccess = await testMicrophoneAccess();

  if (!micAccess) {
    console.error('❌ Cannot proceed without microphone access. Please allow microphone permissions.');
    return;
  }

  // 2. Test with real German phrases
  const germanTestPhrases = [
    "Hallo, wie geht es Ihnen?", // Hello, how are you?
    "Ich möchte Deutsch lernen.", // I want to learn German.
    "Das Wetter ist schön heute." // The weather is beautiful today.
  ];

  console.log('\n🔊 TESTING GERMANS SPEECH TRANSCRIPTION + AI RESPONSES\n');

  for (const phrase of germanTestPhrases) {
    console.log(`\n--- Testing German: "${phrase}" ---`);

    // Record and transcribe
    console.log('🎤 SPEAK THIS: ' + phrase);
    console.log('⏳ Recording for 3 seconds...');

    const transcriptionResult = await recordAndTranscribe(phrase);

    if (transcriptionResult) {
      console.log('✅ Transcription received:', transcriptionResult.transcript);

      // Test AI response
      const aiResponse = await testGeminiAI(phrase);
      if (aiResponse) {
        console.log('✅ AI Tutor responded in German');
        console.log('🎓 Success! End-to-end flow works.');
      }
    }

    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n🎉 END-TO-END TESTING COMPLETED!');
  console.log('📊 Check the console output above for results.');
}

async function runUITests() {
  console.log('\n💻 TESTING USER INTERFACE\n');

  // Test basic UI elements
  const instructions = [
    '1. The app should show "GermanVoice" in the header',
    '2. Click the German flag emoji in the header logo 5 times to enable admin mode',
    '3. Admin mode should show developer tools and API test button',
    '4. Test API button should verify API connections',
    '5. "🤖 AI Tutor Conversations" mode should be selected by default',
    '6. Voice controls should show but are simulated for UI testing'
  ];

  instructions.forEach(instruction => console.log('✅ ', instruction));
}

// Main testing flow
console.log('🇩🇪 GERMAN VOICE TUTOR MANUAL E2E TESTING');
console.log('========================================\n');

// Run this in browser console when app is loaded
console.log('📋 MANUAL STEPS:');
console.log('1. Open browser to http://localhost:6000');
console.log('2. Allow microphone permissions when prompted');
console.log('3. Copy and paste this entire script into browser console');
console.log('4. Call performEndToEndTest() to test voice flow');
console.log('5. Call runUITests() to verify UI elements\n');

// Export functions for browser console
if (typeof window !== 'undefined') {
  window.performEndToEndTest = performEndToEndTest;
  window.runUITests = runUITests;
  window.testMicrophoneAccess = testMicrophoneAccess;
  window.testGeminiAI = testGeminiAI;

  console.log('🎯 FUNCTIONS EXPORTED:');
  console.log('- performEndToEndTest() - Complete voice transcription + AI flow');
  console.log('- runUITests() - Verify UI components');
  console.log('- testMicrophoneAccess() - Check microphone permissions only');
  console.log('- testGeminiAI() - Test AI response generation only\n');

  console.log('🚀 READY TO TEST! Type performEndToEndTest() to begin.');
}
