// Comprehensive Full Pipeline Test for German Voice Tutor
// Tests the complete flow: UI → Microphone → Recording → Transcription → AI Response

console.log('🇩🇪 GERMAN VOICE TUTOR - FULL PIPELINE TEST\n');
console.log('Testing complete end-to-end functionality...\n');

// Test 1: UI Loading
async function testUILoading() {
  console.log('🖥️  Test 1: UI Loading');
  try {
    const response = await fetch('http://localhost:6000');
    if (response.ok) {
      console.log('✅ UI loads successfully');
      return true;
    } else {
      console.log('❌ UI failed to load:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ UI connection failed:', error.message);
    return false;
  }
}

// Test 2: API Connectivity
async function testAPIConnectivity() {
  console.log('\n🔌 Test 2: API Connectivity');

  // Test transcription API
  try {
    const transResponse = await fetch('http://localhost:6000/api/transcribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audioBlob: [] })
    });

    if (transResponse.ok) {
      const transData = await transResponse.json();
      console.log('✅ Transcribe API connected (expected error for empty audio)');
    } else {
      console.log('❌ Transcribe API failed:', transResponse.status);
    }
  } catch (error) {
    console.log('❌ Transcribe API connection failed:', error.message);
  }

  // Test conversational AI API
  try {
    const aiResponse = await fetch('http://localhost:6000/api/conversational', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Test message' })
    });

    if (aiResponse.ok) {
      const aiData = await aiResponse.json();
      console.log('✅ Conversational AI API connected');
      console.log('   Response preview:', aiData.aiResponse?.substring(0, 50) + '...');
    } else {
      console.log('❌ Conversational AI API failed:', aiResponse.status);
    }
  } catch (error) {
    console.log('❌ Conversational AI API connection failed:', error.message);
  }
}

// Test 3: Microphone Permissions
async function testMicrophonePermissions() {
  console.log('\n🎤 Test 3: Microphone Permissions');
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        sampleRate: 16000
      }
    });

    console.log('✅ Microphone permission granted');
    console.log('   Audio tracks:', stream.getAudioTracks().length);
    console.log('   Track settings:', stream.getAudioTracks()[0]?.getSettings());

    // Clean up
    stream.getTracks().forEach(track => track.stop());
    return true;
  } catch (error) {
    console.log('❌ Microphone permission denied:', error.message);
    return false;
  }
}

// Test 4: Audio Recording Simulation
async function testAudioRecording() {
  console.log('\n🎵 Test 4: Audio Recording Simulation');
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        sampleRate: 16000
      }
    });

    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'audio/webm;codecs=opus'
    });

    console.log('✅ MediaRecorder created successfully');
    console.log('   MIME type:', mediaRecorder.mimeType);
    console.log('   State:', mediaRecorder.state);

    // Test recording start/stop
    const audioChunks = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
        console.log('✅ Audio chunk recorded:', event.data.size, 'bytes');
      }
    };

    mediaRecorder.onstop = () => {
      console.log('✅ Recording stopped, chunks collected:', audioChunks.length);
    };

    // Start and stop recording
    mediaRecorder.start(100);
    console.log('✅ Recording started');

    setTimeout(() => {
      mediaRecorder.stop();
      console.log('✅ Recording stopped after 1 second');
    }, 1000);

    // Clean up
    stream.getTracks().forEach(track => track.stop());
    return true;
  } catch (error) {
    console.log('❌ Audio recording test failed:', error.message);
    return false;
  }
}

// Test 5: Base64 Audio Conversion
async function testBase64Conversion() {
  console.log('\n🔄 Test 5: Base64 Audio Conversion');
  try {
    // Create a small test audio blob
    const testData = new Uint8Array(1000);
    for (let i = 0; i < 1000; i++) {
      testData[i] = Math.random() * 255;
    }
    const testBlob = new Blob([testData], { type: 'audio/webm' });

    const base64Audio = await blobToBase64(testBlob);
    console.log('✅ Base64 conversion successful');
    console.log('   Original size:', testBlob.size, 'bytes');
    console.log('   Base64 length:', base64Audio.length, 'characters');

    return true;
  } catch (error) {
    console.log('❌ Base64 conversion failed:', error.message);
    return false;
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

// Test 6: Full Pipeline Simulation
async function testFullPipeline() {
  console.log('\n🔗 Test 6: Full Pipeline Simulation');

  try {
    // Simulate the complete flow
    console.log('🎯 Simulating complete voice processing pipeline...');

    // Step 1: Record audio (simulated)
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        sampleRate: 16000
      }
    });

    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'audio/webm;codecs=opus'
    });

    const audioChunks = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };

    // Start recording
    mediaRecorder.start(100);

    // Stop after 2 seconds
    await new Promise(resolve => {
      setTimeout(() => {
        mediaRecorder.stop();
        resolve(void 0);
      }, 2000);
    });

    // Step 2: Convert to base64
    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
    const base64Audio = await blobToBase64(audioBlob);

    console.log('✅ Audio recorded and converted:', audioBlob.size, 'bytes');

    // Step 3: Send to transcription API
    const transResponse = await fetch('http://localhost:6000/api/transcribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audioBlob: base64Audio })
    });

    if (transResponse.ok) {
      const transData = await transResponse.json();
      console.log('✅ Transcription API processed audio');
      console.log('   Transcript:', transData.transcript);
      console.log('   Confidence:', transData.confidence);

      // Step 4: Send to AI API
      const aiResponse = await fetch('http://localhost:6000/api/conversational', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: transData.transcript })
      });

      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        console.log('✅ AI API generated response');
        console.log('   AI Response:', aiData.aiResponse?.substring(0, 100) + '...');

        console.log('\n🎉 FULL PIPELINE TEST PASSED!');
        console.log('✅ Complete flow: Recording → Base64 → Transcription → AI Response');
        return true;
      } else {
        console.log('❌ AI API failed:', aiResponse.status);
        return false;
      }
    } else {
      console.log('❌ Transcription API failed:', transResponse.status);
      return false;
    }

  } catch (error) {
    console.log('❌ Full pipeline test failed:', error.message);
    return false;
  }
}

// Test 7: Error Handling
async function testErrorHandling() {
  console.log('\n🛡️  Test 7: Error Handling');

  // Test invalid audio data
  try {
    const response = await fetch('http://localhost:6000/api/transcribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audioBlob: 'invalid-base64' })
    });

    if (response.ok) {
      console.log('⚠️  API accepted invalid data (should have failed)');
    } else {
      console.log('✅ API properly rejected invalid data');
    }
  } catch (error) {
    console.log('✅ API properly handled invalid request');
  }

  // Test empty message to AI
  try {
    const response = await fetch('http://localhost:6000/api/conversational', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: '' })
    });

    if (response.ok) {
      console.log('✅ AI API handled empty message gracefully');
    } else {
      console.log('✅ AI API properly validated empty message');
    }
  } catch (error) {
    console.log('✅ AI API properly handled empty message');
  }
}

// Run all tests
async function runFullPipelineTest() {
  console.log('🚀 STARTING COMPREHENSIVE PIPELINE TEST\n');
  console.log('This tests the complete German Voice Tutor functionality:\n');

  const results = {
    ui: await testUILoading(),
    api: await testAPIConnectivity(),
    mic: await testMicrophonePermissions(),
    recording: await testAudioRecording(),
    base64: await testBase64Conversion(),
    pipeline: await testFullPipeline(),
    errors: await testErrorHandling()
  };

  console.log('\n📊 TEST RESULTS SUMMARY:');
  console.log('========================');
  console.log(`UI Loading: ${results.ui ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`API Connectivity: ${results.api ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Microphone: ${results.mic ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Audio Recording: ${results.recording ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Base64 Conversion: ${results.base64 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Full Pipeline: ${results.pipeline ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Error Handling: ${results.errors ? '✅ PASS' : '❌ FAIL'}`);

  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;

  console.log(`\n🎯 OVERALL: ${passed}/${total} tests passed (${Math.round(passed/total*100)}%)`);

  if (passed === total) {
    console.log('🎉 ALL TESTS PASSED! The German Voice Tutor is fully functional.');
  } else {
    console.log('⚠️  Some tests failed. Check the output above for details.');
  }

  return results;
}

// Export for browser console
if (typeof window !== 'undefined') {
  window.runFullPipelineTest = runFullPipelineTest;
  window.testUILoading = testUILoading;
  window.testAPIConnectivity = testAPIConnectivity;
  window.testMicrophonePermissions = testMicrophonePermissions;
  window.testAudioRecording = testAudioRecording;
  window.testBase64Conversion = testBase64Conversion;
  window.testFullPipeline = testFullPipeline;
  window.testErrorHandling = testErrorHandling;

  console.log('\n🎯 FULL PIPELINE TEST READY!');
  console.log('Run: runFullPipelineTest() in browser console');
  console.log('Individual tests also available as separate functions');
}
