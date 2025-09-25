<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  
  // State management
  let isConnecting = false;
  let isConnected = false;
  let isSpeaking = false;
  let isProcessing = false;
  let error = '';
  let statusMessage = 'Ready to connect';
  let conversationHistory: Array<{role: string, content: string, timestamp: Date}> = [];
  let showSettings = false;

  // Enhanced Audio elements for Deepgram Voice Agent with visualization
  let audioContext: AudioContext;
  let audioStream: MediaStream;
  let audioInput: MediaStreamAudioSourceNode;
  let audioOutput: AudioBufferSourceNode;
  let mediaRecorder: MediaRecorder | null = null;
  let gainNode: GainNode; // For volume control
  let analyserNode: AnalyserNode; // For audio level monitoring
  let audioLevel = 0; // Real-time audio level for visualization
  let analyserData: Uint8Array; // For FFT analysis
  let animationFrameId: number; // For visualization animation
  let isRecording = false; // Current recording state
  let callDuration = 0; // Call duration tracking
  let durationInterval: number; // Duration timer

  // Deepgram Voice Agent
  let socket: WebSocket | null = null;

  // UI State - simplified for phone call style
  let selectedVoice = 'aura-asteria-en';
  let inputText = '';

  // Available voices for simplified selection
  const voices = [
    { id: 'aura-asteria-en', name: 'Asteria (Female)' },
    { id: 'aura-luna-en', name: 'Luna (Female)' },
    { id: 'aura-stella-en', name: 'Stella (Female)' },
    { id: 'aura-orion-en', name: 'Orion (Male)' },
    { id: 'aura-helios-en', name: 'Helios (Male)' }
  ];
  
  // Initialize audio context
  async function initAudio() {
    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioInput = audioContext.createMediaStreamSource(audioStream);
      updateStatus('Audio initialized');
      } catch (err) {
        handleError('Failed to initialize audio', err);
      }
  }
  
  // Update status message
  function updateStatus(message: string, isError = false) {
    statusMessage = message;
    if (isError) {
      console.error(message);
    } else {
      console.log(message);
    }
  }
  
  // Handle errors
  function handleError(message: string, err?: unknown) {
    const errMsg = err ? (err instanceof Error ? err.message : String(err)) : '';
    error = message + (errMsg ? `: ${errMsg}` : '');
    updateStatus(error, true);
    isConnecting = false;
    isConnected = false;
    if (socket) {
      socket.close();
      socket = null;
    }
  }
  
  // Connect to Deepgram Voice Agent
  async function connectToAgent() {
    if (isConnecting || isConnected) return;
    
    isConnecting = true;
    updateStatus('Connecting to voice agent...');
    
    try {
      // Get a session token from our server
      const response = await fetch('/api/voice-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          voice: selectedVoice
        })
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }
      
      const { token } = await response.json();
      
      // Create WebSocket connection
      socket = new WebSocket(`wss://api.deepgram.com/v1/listen/agent?token=${token}`);
      
      socket.onopen = () => {
        updateStatus('Connected to voice agent');
        isConnecting = false;
        isConnected = true;
        startAudioCapture();
      };
      
      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleAgentMessage(data);
      };
      
      socket.onclose = (event) => {
        updateStatus('Disconnected from voice agent');
        isConnected = false;
        stopAudioCapture();
        if (event.code !== 1000) {
          handleError(`Connection closed with code ${event.code}: ${event.reason}`);
        }
      };
      
      socket.onerror = () => {
        handleError('WebSocket error occurred', undefined);
      };
      
    } catch (err) {
      handleError('Failed to connect to voice agent', err);
    }
  }
  
  // Handle messages from the agent
  function handleAgentMessage(data: any) {
    if (data.type === 'transcript') {
      // Handle user's speech transcription
      const transcript = data.channel.alternatives[0]?.transcript;
      if (transcript && transcript.trim()) {
        // Only process valid, non-empty transcripts
        addToHistory('user', transcript);
        updateStatus('You said: ' + transcript);
      } else {
        // Handle empty/null transcript (no speech detected)
        updateStatus('Ready - Speak clearly to continue');
      }
    }
    else if (data.type === 'speech' && data.speech) {
      // Handle agent's speech response
      isSpeaking = true;
      updateStatus('Agent is speaking...');
      
      // Convert base64 audio to ArrayBuffer
      const audioData = Uint8Array.from(atob(data.speech), c => c.charCodeAt(0));
      
      // Play the audio
      audioContext.decodeAudioData(audioData.buffer, (buffer) => {
        audioOutput = audioContext.createBufferSource();
        audioOutput.buffer = buffer;
        audioOutput.connect(audioContext.destination);
        audioOutput.onended = () => {
          isSpeaking = false;
          updateStatus('Ready');
        };
        audioOutput.start(0);
      });
      
      // Add agent's response to chat
      if (data.text) {
        addToHistory('assistant', data.text);
      }
    }
    else if (data.type === 'error') {
      handleError(`Agent error: ${data.message}`);
    }
  }
  
  // Start capturing audio from microphone
  function startAudioCapture() {
    if (!audioStream) {
      handleError('Audio stream not initialized');
      return;
    }
    
    const audioOptions = {
      mimeType: 'audio/webm;codecs=opus',
      audioBitsPerSecond: 128000
    };
    
    try {
      mediaRecorder = new MediaRecorder(audioStream, audioOptions);
      
      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0 && socket?.readyState === WebSocket.OPEN) {
          const arrayBuffer = await event.data.arrayBuffer();
          socket.send(arrayBuffer);
        }
      };
      
      // Send audio data in chunks
      mediaRecorder.start(100);
      updateStatus('Listening...');
      
    } catch (err) {
      handleError('Failed to start audio capture', err);
    }
  }
  
  // Stop audio capture
  function stopAudioCapture() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    
    if (audioStream) {
      audioStream.getTracks().forEach(track => track.stop());
    }
    
    if (audioOutput) {
      audioOutput.stop();
    }
    
    updateStatus('Audio capture stopped');
  }
  
  // Add message to conversation history
  function addToHistory(role: string, content: string) {
    conversationHistory = [...conversationHistory, {
      role,
      content,
      timestamp: new Date()
    }];
    // Keep only the last 20 messages
    if (conversationHistory.length > 20) {
      conversationHistory = conversationHistory.slice(-20);
    }
  }
  
  // Toggle connection to voice agent
  function toggleConnection() {
    if (isConnected) {
      disconnect();
    } else {
      connectToAgent();
    }
  }
  
  // Disconnect from voice agent
  function disconnect() {
    if (socket) {
      socket.close();
      socket = null;
    }
    
    stopAudioCapture();
    isConnected = false;
    isConnecting = false;
    updateStatus('Disconnected');
  }
  
  // Clean up on component destroy
  onDestroy(() => {
    disconnect();
    if (audioContext) {
      audioContext.close();
    }
  });
  
  // Initialize audio when component mounts
  onMount(() => {
    initAudio();
  });



  // Send text message to the agent
  async function sendTextToAgent(text: string) {
    if (!isConnected || !socket) return;
    
    try {
      // Add user message to history
      addToHistory('user', text);
      
      // Send text message to the agent
      socket.send(JSON.stringify({
        type: 'text',
        text: text,
        timestamp: new Date().toISOString()
      }));
      
      // Clear input
      inputText = '';
    } catch (err) {
      handleError('Failed to send message', err as Error);
    }
  }

  // Clear the conversation history
  function clearConversation() {
    conversationHistory = [];
  }

  // Handle text form submission
  function handleTextSubmit() {
    if (!inputText.trim()) return;
    sendTextToAgent(inputText);
  }
</script>

<main class="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-8">
    <div class="max-w-6xl mx-auto">
    <!-- Header with Status -->
    <header class="text-center mb-8">
      <h1 class="text-4xl font-bold text-gray-800 mb-2 flex items-center justify-center">
        <span>📞 Deepgram Voice Tutor</span>
        {#if isConnected}
          <div class="ml-3 flex items-center">
            <div class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span class="ml-2 text-sm text-green-600 font-medium">ON AIR</span>
          </div>
        {:else if isConnecting}
          <div class="ml-3 flex items-center">
            <div class="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
            <span class="ml-2 text-sm text-orange-600 font-medium">CONNECTING...</span>
          </div>
        {/if}
      </h1>
      <p class="text-gray-600 mb-4">
        {#if isConnected}
          Practice speaking German naturally - all conversations are listened to in real-time!
        {:else}
          Click "Connect" to start your German voice practice session
        {/if}
      </p>

      <!-- Real-time Audio Level Visualizer -->
      {#if isConnected}
        <div class="bg-white rounded-lg shadow-sm border p-4 mb-4 inline-block">
          <div class="flex items-center space-x-3">
            <div class="flex items-center space-x-2">
              <svg class="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clip-rule="evenodd" />
              </svg>
              <span class="text-sm font-medium text-gray-700">Microphone:</span>
            </div>
            <div class="flex space-x-1">
              {#each Array(8) as _, i}
                <div
                  class="w-2 bg-gradient-to-t from-blue-400 to-blue-600 rounded-sm"
      class:h-2={audioLevel > i * 20}
      class:h-1={audioLevel <= i * 20}
      class:opacity-100={audioLevel > i * 20}
      class:opacity-30={audioLevel <= i * 20}
      class:animate-pulse={audioLevel > i * 20 && i % 2 === 0}
                ></div>
              {/each}
            </div>
            <span class="text-xs text-gray-500 ml-3">
              {#if isRecording}
                <span class="text-red-600 font-medium">● REC</span>
              {:else}
                Live audio input
              {/if}
            </span>
          </div>
        </div>
      {/if}

      <!-- Status with better visual cues -->
      <div class="flex items-center justify-center mt-4 space-x-4 text-sm">
        <div class="flex items-center space-x-2">
          {#if isConnected}
            <svg class="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
            <span class="text-green-700 font-medium">Connected & Listening</span>
          {:else if isConnecting}
            <div class="animate-spin rounded-full h-4 w-4 border-2 border-orange-500 border-t-transparent"></div>
            <span class="text-orange-700 font-medium">Establishing connection...</span>
          {:else}
            <svg class="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
            <span class="text-gray-600">Ready to start practicing German</span>
          {/if}
        </div>
      </div>

      {#if isConnected}
        <div class="mt-3 text-xs text-gray-500">
          Peak of natural voice practice - speak continuously like in a real conversation!
        </div>
      {/if}
    </header>

    <!-- Main Content -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Left Panel - Controls -->
      <div class="bg-white rounded-xl shadow-md p-6">
        <h2 class="text-xl font-semibold mb-4 text-gray-800">Session Controls</h2>
        
        <div class="space-y-4">
          <!-- Connection Toggle -->
          <button
            on:click={toggleConnection}
            class="w-full flex items-center justify-center px-6 py-3 rounded-lg font-medium text-white transition-colors duration-200
                   {isConnected ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-600 hover:bg-blue-700'}"
            disabled={isConnecting}
          >
            {#if isConnecting}
              <svg class="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Connecting...
            {:else if isConnected}
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd" />
              </svg>
              Disconnect
            {:else}
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clip-rule="evenodd" />
              </svg>
              Connect to Voice Agent
            {/if}
          </button>


        </div>

        <!-- Quick Actions -->
        <div class="mt-6">
          <h3 class="text-sm font-medium text-gray-700 mb-2">Quick Actions</h3>
          <div class="grid grid-cols-2 gap-2">
            <button
              on:click={() => sendTextToAgent('Können Sie das bitte wiederholen?')}
              class="flex items-center justify-center px-3 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              disabled={!isConnected}
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Repeat
            </button>
            <button
              on:click={() => sendTextToAgent('Können Sie das bitte übersetzen?')}
              class="flex items-center justify-center px-3 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              disabled={!isConnected}
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
              Translate
            </button>
            <button
              on:click={() => sendTextToAgent('Können Sie das bitte langsamer sagen?')}
              class="flex items-center justify-center px-3 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              disabled={!isConnected}
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              Slower
            </button>
            <button
              on:click={clearConversation}
              class="flex items-center justify-center px-3 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Clear
            </button>
          </div>
        </div>
      </div>

      <!-- Center Panel - Conversation -->
      <div class="lg:col-span-2 bg-white rounded-xl shadow-md overflow-hidden flex flex-col">
        <!-- Conversation Header -->
        <div class="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold text-gray-800">Conversation</h2>
          </div>
        </div>

        <!-- Messages -->
        <div class="flex-1 overflow-y-auto p-6 space-y-4" id="messages-container">
          {#if conversationHistory.length === 0}
            <div class="flex flex-col items-center justify-center h-64 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <p>Start a conversation with the voice agent</p>
            </div>
          {:else}
            {#each conversationHistory as message, i}
              <div class="flex {message.role === 'user' ? 'justify-end' : 'justify-start'} mb-4">
                <div class="flex max-w-xs lg:max-w-md">
                  <div class="flex-shrink-0 h-8 w-8 rounded-full bg-blue-500 text-white flex items-center justify-center mr-2">
                    {#if message.role === 'user'}
                      <span>You</span>
                    {:else}
                      <span>AI</span>
                    {/if}
                  </div>
                  <div class="px-4 py-2 rounded-lg {message.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-800'}">
                    <p class="text-sm">{message.content}</p>
                    <p class="text-xs mt-1 opacity-70">
                      {new Date(message.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  </div>
                </div>
              </div>
            {/each}
          {/if}
        </div>

        <!-- Input Area -->
        <div class="border-t border-gray-200 p-4">
          <form on:submit|preventDefault={handleTextSubmit} class="flex space-x-2">
            <input
              type="text"
              bind:value={inputText}
              placeholder="Type your message..."
              class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={!isConnected}
            />
            <button
              type="submit"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              disabled={!isConnected || !inputText.trim()}
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
            </button>
            <button
              type="button"
              class={`flex items-center justify-center px-4 py-2 rounded-lg font-medium text-white transition-colors duration-200 ${
                isConnected ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-400 cursor-not-allowed'
              }`}
              disabled={!isConnected}
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 14a4.367 4.367 0 00-1.11-.81L17.073 4H18V3z"/>
              </svg>
              Voice Active
            </button>
          </form>
        </div>
      </div>
    </div>

    <!-- Error Alert -->
    {#if error}
      <div class="fixed bottom-4 right-4 max-w-sm bg-red-50 border-l-4 border-red-500 p-4 rounded-lg shadow-lg">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm text-red-700">{error}</p>
          </div>
          <div class="ml-4 flex-shrink-0 flex">
            <button on:click={() => error = ''} class="inline-flex text-red-500 focus:outline-none focus:text-red-700">
              <span class="sr-only">Close</span>
              <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    {/if}
  </div>

  <style>
    /* Custom scrollbar */
    #messages-container::-webkit-scrollbar {
      width: 6px;
    }
    #messages-container::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 10px;
    }
    #messages-container::-webkit-scrollbar-thumb {
      background: #cbd5e0;
      border-radius: 10px;
    }
    #messages-container::-webkit-scrollbar-thumb:hover {
      background: #a0aec0;
    }
    
    /* Smooth animations */
    .fade-enter-active, .fade-leave-active {
      transition: opacity 200ms;
    }
    .fade-enter, .fade-leave-to {
      opacity: 0;
    }
    
    /* Custom range input */
    input[type="range"] {
      -webkit-appearance: none;
      height: 6px;
      background: #e2e8f0;
      border-radius: 3px;
    }
    
    input[type="range"]::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: #3b82f6;
      cursor: pointer;
    }
    
    /* Button focus states */
    button:focus {
      outline: none;
      box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.5);
    }

    /* Box styling */
    .box {
      border: 1px solid #eee;
      padding: 1em;
      border-radius: 8px;
      background-color: #f9f9f9;
    }

    h2 {
      font-size: 1em;
      color: #555;
      margin-top: 0;
    }

    .loading {
      margin-top: 2em;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .spinner {
      border: 4px solid rgba(0, 0, 0, 0.1);
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border-left-color: #007bff;
      animation: spin 1s ease infinite;
    }

    @keyframes spin {
      0% {
        transform: rotate(0deg);
      }
      100% {
        transform: rotate(360deg);
      }
    }

    .error {
      color: #ef4444;
      margin-top: 1em;
      padding: 0.5em;
      background-color: #fef2f2;
      border-radius: 4px;
    }
  </style>
</main>
