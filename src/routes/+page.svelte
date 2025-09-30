<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { VoiceAgentService } from '../services/VoiceAgentService';

  // --- Types ---
  interface Message {
    text: string;
    type: 'user' | 'system' | 'ai' | 'correction' | 'translation';
    timestamp: Date;
    translation?: string;
  }

  interface Lesson {
    id: string;
    title: string;
    topic: string;
    level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1';
  }

  // --- State ---
  let status: string = 'Bereit zum Lernen'; // Ready to learn
  let isConnected: boolean = false;
  let isRecording: boolean = false;
  let messages: Message[] = [];
  let voiceAgentService: VoiceAgentService;

  // --- UI State ---
  let userLevel: 'A1' | 'A2' | 'B1' = 'A1';
  let showTranslation: boolean = true;

  const currentLesson: Lesson = {
    id: 'greetings',
    title: 'Grüße und Vorstellungen',
    topic: 'Alltagskommunikation',
    level: 'A1',
  };

  // --- Functions ---
  function addMessage(text: string, type: Message['type'] = 'system', translation?: string): void {
    const message: Message = {
      text,
      type,
      timestamp: new Date(),
      translation: showTranslation ? translation : undefined,
    };
    messages = [...messages, message];
  }

  async function toggleConnection(): Promise<void> {
    if (isConnected) {
      voiceAgentService.disconnect();
    } else {
      status = 'Connecting...';
      addMessage('Connecting to Voice Agent...');
      try {
        await voiceAgentService.connect();
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Unknown connection error');
        status = 'Connection Failed';
        addMessage(`Failed to connect: ${err.message}`);
      }
    }
  }

  function startRecording(): void {
    voiceAgentService.startRecording();
  }

  function stopRecording(): void {
    voiceAgentService.stopRecording();
  }

  // --- Lifecycle ---
  onMount(() => {
    voiceAgentService = new VoiceAgentService();

    voiceAgentService.on('status', (newStatus: string) => {
      status = newStatus;
    });

    voiceAgentService.on('connected', () => {
      isConnected = true;
      status = 'Connected';
      addMessage('WebSocket connected to Deepgram Voice Agent');
    });

    voiceAgentService.on('disconnected', () => {
      isConnected = false;
      isRecording = false;
      status = 'Disconnected';
      addMessage('Disconnected from Voice Agent');
    });

    voiceAgentService.on('message', (message: any) => {
      if (message.type === 'transcription' && message.channel.alternatives[0]?.transcript) {
        addMessage(message.channel.alternatives[0].transcript, 'user');
      } else if (message.type === 'speech') {
        addMessage('AI is speaking...', 'ai');
      } else {
        console.log('Unhandled message:', message);
      }
    });

    voiceAgentService.on('recording', (recording: boolean) => {
        isRecording = recording;
        if(recording) {
            addMessage('Started recording - speak now...');
        } else {
            addMessage('Stopped recording');
        }
    });

    voiceAgentService.on('error', (error: Error) => {
      addMessage(`Error: ${error.message}`, 'system');
      status = 'Connection Error';
    });

    addMessage('Willkommen beim Deutschen Sprachkurs! 👋', 'ai', 'Welcome to the German Language Course!');
    setTimeout(() => {
      addMessage('Bereit für Ihre erste Lektion? Ich bin hier um Ihnen beim Lernen zu helfen.', 'ai', 'Ready for your first lesson? I\'m here to help you learn.');
    }, 1000);
  });

  onDestroy(() => {
    if (voiceAgentService) {
      voiceAgentService.disconnect();
    }
  });

</script>

<!-- HTML remains largely the same, but event handlers now call service methods -->
<main class="min-h-screen bg-slate-900 p-6">
  <div class="max-w-6xl mx-auto">

    <!-- Header -->
    <header class="text-center mb-8">
      <h1 class="text-4xl font-bold text-white mb-2">🇩🇪 German Language Tutor</h1>
      <h2 class="text-lg text-slate-300 mb-1">{currentLesson.title}</h2>
      <p class="text-sm text-slate-400">Level: {userLevel} • Topic: {currentLesson.topic}</p>
    </header>

    <!-- Lesson Controls -->
    <div class="flex flex-wrap gap-4 mb-6 justify-center">
      <select bind:value={userLevel} class="bg-slate-800 text-white px-4 py-2 rounded-lg border border-slate-600">
        <option value="A1">A1 - Beginner</option>
        <option value="A2">A2 - Elementary</option>
        <option value="B1">B1 - Intermediate</option>
      </select>
      <button class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        on:click={() => showTranslation = !showTranslation}>
        🔤 {showTranslation ? 'Hide' : 'Show'} Translations
      </button>
    </div>

    <!-- Connection Status -->
    <div class="bg-slate-800 p-4 rounded-lg mb-6">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <div class="w-3 h-3 rounded-full {isConnected ? 'bg-green-400' :
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
              {#if msg.translation}
                <div class="text-xs opacity-80 italic mt-1">{msg.translation}</div>
              {/if}
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
        <div>Service Connected: {isConnected}</div>
        <div>Service Status: {status}</div>
        <div>Recording: {isRecording}</div>
        <div>Messages: {messages.length}</div>
      </div>
    </div>

  </div>
</main>

<style>
  .animation-delay-200 { animation-delay: 0.2s; }
  .animation-delay-400 { animation-delay: 0.4s; }
</style>