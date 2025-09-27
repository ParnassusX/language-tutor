<script lang="ts">
  // Based on Deepgram Voice Agent documentation
  // https://docs.deepgram.com/reference/voice-agent
  import { onMount } from 'svelte';

  // Types for better type safety
  interface Message {
    text: string;
    type: 'user' | 'system' | 'ai';
    timestamp: Date;
  }

  // State with proper types
  let status: string = 'Disconnected';
  let isConnected: boolean = false;
  let messages: Message[] = [];
  let socket: WebSocket | null = null;
  let audioContext: AudioContext | null = null;
  let micStream: MediaStream | null = null;
  let recorder: MediaRecorder | null = null;
  let isRecording: boolean = false;

  function addMessage(text: string, type: 'user' | 'system' | 'ai' = 'system'): void {
    messages = [...messages, {
      text,
      type,
      timestamp: new Date()
    }];
    console.log(`[${new Date().toLocaleTimeString()}] ${type.toUpperCase()}:`, text);
  }

  async function initAudio(): Promise<void> {
    try {
      addMessage('Initializing audio...');
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStream = stream;
      addMessage('Microphone access granted');
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown audio error');
      addMessage('Audio initialization failed: ' + err.message);
    }
  }

  async function toggleConnection(): Promise<void> {
    if (isConnected) {
      disconnect();
    } else {
      await connect();
    }
  }

  async function getSecureToken(): Promise<string> {
    try {
      const response = await fetch('/api/voice-agent');
      if (!response.ok) {
        throw new Error(`Failed to get token: ${response.status}`);
      }
      const data = await response.json();
      return data.token;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown token error');
      addMessage(`Failed to get secure token: ${err.message}`);
      throw err;
    }
  }

  async function connect(): Promise<void> {
    if (!audioContext) {
      await initAudio();
    }

    try {
      status = 'Connecting...';
      addMessage('Connecting to Voice Agent...');

      // Get secure token from server instead of hardcoding
      const token = await getSecureToken();

      // Deepgram Voice Agent WebSocket connection
      const wsUrl = `wss://api.deepgram.com/v1/listen/agent?token=${token}`;
      socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        status = 'Connected';
        isConnected = true;
        addMessage('WebSocket connected to Deepgram Voice Agent');

        // Send Settings as first message (per Deepgram docs)
        const settings = {
          type: 'Settings',
          language: 'en-us',
          model: 'aura-2-en',
          speak: {
            speed: 0.9,
            style: 0.5
          },
          listen: {
            endpointing: 300,
            no_speech_timeout: 2500
          },
          think: {
            provider: {
              type: 'open_ai',
              model: 'gpt-4o-mini',
              temperature: 0.7,
              max_tokens: 150
            },
            prompt: `You are a helpful German language tutor. Respond only in German unless the user specifically asks for English. Keep responses conversational and encouraging.`
          }
        };

        if (socket) {
          socket.send(JSON.stringify(settings));
        }
        addMessage('Voice Agent settings sent');
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'transcription') {
            const transcript = data.channel.alternatives[0]?.transcript;
            if (transcript) {
              addMessage(transcript, 'user');
            }
          } else if (data.type === 'speech' && data.speech) {
            addMessage('AI is speaking...', 'ai');
            console.log('Received AI speech:', data.speech); // Could play audio here
          } else if (data.type === 'error') {
            addMessage('Error: ' + data.message, 'system');
          } else {
            console.log('Unhandled message type:', data.type, data);
          }
        } catch (error) {
          console.log('Raw message:', event.data);
        }
      };

      socket.onclose = () => {
        disconnect();
        addMessage('Voice Agent disconnected');
      };

      socket.onerror = (error) => {
        status = 'Connection Error';
        isConnected = false;
        addMessage('WebSocket error occurred');
        console.error('WebSocket error:', error);
      };

    } catch (error) {
      status = 'Connection Failed';
      const err = error instanceof Error ? error : new Error('Unknown connection error');
      addMessage('Failed to connect: ' + err.message);
    }
  }

  function disconnect(): void {
    if (socket) {
      socket.close();
      socket = null;
    }
    if (isRecording) {
      stopRecording();
    }
    status = 'Disconnected';
    isConnected = false;
    addMessage('Disconnected from Voice Agent');
  }

  function startRecording(): void {
    if (!isConnected || !micStream) {
      addMessage('Not connected or no microphone access');
      return;
    }

    try {
      const mediaRecorder = new MediaRecorder(micStream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        if (chunks.length > 0 && socket && socket.readyState === WebSocket.OPEN) {
          // Combine chunks and send as ArrayBuffer
          const blob = new Blob(chunks, { type: 'audio/webm' });
          blob.arrayBuffer().then(buffer => {
            if (socket && socket.readyState === WebSocket.OPEN) {
              socket.send(buffer);
              addMessage('Audio sent to Voice Agent');
            }
          });
        }
      };

      // Start recording
      mediaRecorder.start();
      recorder = mediaRecorder;
      isRecording = true;

      addMessage('Started recording - speak now...');

      // Stop after 5 seconds (for demo)
      setTimeout(() => {
        if (isRecording) {
          stopRecording();
        }
      }, 5000);

    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown recording error');
      addMessage('Failed to start recording: ' + err.message);
    }
  }

  function stopRecording(): void {
    if (recorder && recorder.state === 'recording') {
      recorder.stop();
      recorder = null;
      isRecording = false;
      addMessage('Stopped recording');
    }
  }

  onMount(async () => {
    addMessage('App loaded - Voice Agent Demo');
  });
</script>

<!-- Deepgram Voice Agent - Based on Official Docs -->
<main class="min-h-screen bg-slate-900 p-6">
  <div class="max-w-4xl mx-auto">

    <!-- Header -->
    <header class="text-center mb-8">
      <h1 class="text-3xl font-bold text-white mb-2">🎵 Voice Agent Demo</h1>
      <p class="text-slate-400">Based on Deepgram Voice Agent API</p>
    </header>

    <!-- Connection Status -->
    <div class="bg-slate-800 p-4 rounded-lg mb-6">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <div class="w-3 h-3 rounded-full {status === 'Connected' ? 'bg-green-400' :
           status === 'Connecting...' ? 'bg-orange-400' : 'bg-red-400'}"></div>
          <span class="text-white font-medium">Status: {status}</span>
        </div>
        <button
          on:click={toggleConnection}
          class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          {isConnected ? 'Disconnect' : 'Connect'}
        </button>
      </div>
    </div>

    <!-- Chat Area -->
    <div class="bg-slate-800 rounded-lg p-4 mb-6 h-96 overflow-y-auto">
      <h3 class="text-white font-semibold mb-4">Conversation</h3>
      <div id="messages" class="space-y-3">
        {#each messages as msg}
          <div class="flex {msg.type === 'user' ? 'justify-end' : 'justify-start'}">
            <div class="max-w-sm px-4 py-2 rounded-lg {msg.type === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-white'}">
              <div class="text-sm">{msg.text}</div>
              <div class="text-xs opacity-70 mt-1">{new Date(msg.timestamp).toLocaleTimeString()}</div>
            </div>
          </div>
        {/each}
        {#if isRecording}
          <div class="flex justify-center">
            <div class="px-4 py-2 rounded-lg bg-slate-700 text-white flex items-center">
              <div class="flex space-x-1 mr-3">
                <div class="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <div class="w-2 h-2 bg-blue-400 rounded-full animate-pulse animation-delay-200"></div>
                <div class="w-2 h-2 bg-blue-400 rounded-full animate-pulse animation-delay-400"></div>
              </div>
              <span class="text-sm">Recording...</span>
            </div>
          </div>
        {/if}
      </div>
    </div>

    <!-- Controls -->
    <div class="flex space-x-4">
      <button
        on:click={startRecording}
        disabled={!isConnected || isRecording}
        class="flex-1 py-3 px-6 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white rounded-lg transition-colors"
      >
        🎤 Speak
      </button>

      <button
        on:click={stopRecording}
        disabled={!isRecording}
        class="flex-1 py-3 px-6 bg-red-600 hover:bg-red-700 disabled:bg-slate-600 text-white rounded-lg transition-colors"
      >
        ⏹️ Stop
      </button>
    </div>

    <!-- Debug Info -->
    <div class="mt-8 bg-slate-800 p-4 rounded-lg">
      <h4 class="text-white font-semibold mb-3">Debug Info</h4>
      <div class="text-slate-400 text-sm space-y-1">
        <div>WebSocket URL: wss://api.deepgram.com/v1/listen/agent?token=***</div>
        <div>Audio Context: {audioContext ? 'Available' : 'Not initialized'}</div>
        <div>Microphone: {micStream ? 'Available' : 'Not requested'}</div>
        <div>Messages: {messages.length}</div>
      </div>
    </div>

  </div>
</main>

<style>
  .animation-delay-200 { animation-delay: 0.2s; }
  .animation-delay-400 { animation-delay: 0.4s; }
</style>
