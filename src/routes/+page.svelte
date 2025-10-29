<script lang="ts">
  // German Language Learning App
  // Interactive Voice Tutor using Deepgram Voice Agent
  import { onMount } from 'svelte';
  import Header from '$lib/components/Header.svelte';
  import LessonControls from '$lib/components/LessonControls.svelte';
  import ConnectionStatus from '$lib/components/ConnectionStatus.svelte';
  import ChatArea from '$lib/components/ChatArea.svelte';
  import Controls from '$lib/components/Controls.svelte';
  import DebugInfo from '$lib/components/DebugInfo.svelte';
  import { lessons } from '$lib/lessons';
  import type { Lesson } from '$lib/lessons';

  // Enhanced types for German learning
  interface Message {
    text: string;
    type: 'user' | 'system' | 'ai' | 'correction' | 'translation';
    timestamp: Date;
    translation?: string;
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
  }

  interface Lesson {
    id: string;
    title: string;
    topic: string;
    level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1';
    vocalbulary: string[];
    phrases: string[];
  }

  // State management
  let status: string = 'Bereit zum Lernen';
  let isConnected: boolean = false;
  let messages: Message[] = [];
  let socket: WebSocket | null = null;
  let audioContext: AudioContext | null = null;
  let micStream: MediaStream | null = null;
  let recorder: MediaRecorder | null = null;
  let isRecording: boolean = false;
  let isAiThinking: boolean = false;

  // Learning state
  let currentTopic: string = 'Grüße und Vorstellungen';
  let userLevel: 'A1' | 'A2' | 'B1' = 'A1';
  let showTranslation: boolean = true;

  // Current lesson content
  let currentLesson: Lesson = lessons[0];

  function handleLessonChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const lesson = lessons.find(l => l.id === target.value);
    if (lesson) {
      currentLesson = lesson;
    }
  }

  function addMessage(text: string, type: 'user' | 'system' | 'ai' | 'correction' | 'translation' = 'system', translation?: string): void {
    const message: Message = {
      text,
      type,
      timestamp: new Date(),
      translation: showTranslation ? translation : undefined
    };
    messages = [...messages, message];
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

  async function connect(): Promise<void> {
    if (!audioContext) {
      await initAudio();
    }

    try {
      status = 'Connecting...';
      addMessage('Connecting to Voice Agent...');

      // Connect to the backend WebSocket proxy
      const wsUrl = `ws://${window.location.host}`;
      socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        status = 'Connected';
        isConnected = true;
        addMessage('WebSocket connected to backend proxy');

        // Send Settings as first message (per Deepgram docs)
        const settings = {
          type: 'Settings',
          language: 'de',
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
              type: 'google',
              model: 'gemini-1.5-flash',
              temperature: 0.7,
              max_tokens: 150
            },
            prompt: `You are a helpful German language tutor. Respond only in German unless the user specifically asks for English. Keep responses conversational and encouraging. If the user makes a grammar or pronunciation mistake, gently correct them and provide the correct version. For example, if the user says 'Ich gut' you should say 'Ich bin gut'.`
          }
        };

        if (socket) {
          socket.send(JSON.stringify(settings));
        }
        addMessage('Voice Agent settings sent');
      };

      socket.onmessage = (event) => {
        if (typeof event.data === 'string') {
          try {
            const data = JSON.parse(event.data);

            if (data.type === 'transcription') {
              const transcript = data.channel.alternatives[0]?.transcript;
              if (transcript) {
                addMessage(transcript, 'user');
                isAiThinking = true;
              }
            } else if (data.type === 'speech' && data.speech) {
              isAiThinking = false;
              const messageType = data.text.includes('Correction:') ? 'correction' : 'ai';
              addMessage(data.text, messageType);
              playAudio(data.speech);
            } else if (data.type === 'error') {
              addMessage('Error: ' + data.message, 'system');
            } else {
              console.log('Unhandled message type:', data.type, data);
            }
          } catch (error) {
            console.log('Raw message:', event.data);
          }
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
      toggleRecording();
    }
    status = 'Disconnected';
    isConnected = false;
    addMessage('Disconnected from Voice Agent');
  }

  function toggleRecording(): void {
    if (isRecording) {
      if (recorder && recorder.state === 'recording') {
        recorder.stop();
        recorder = null;
        isRecording = false;
        addMessage('Stopped recording');
      }
    } else {
      if (!isConnected || !micStream) {
        addMessage('Not connected or no microphone access');
        return;
      }

      try {
        const mediaRecorder = new MediaRecorder(micStream);

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0 && socket && socket.readyState === WebSocket.OPEN) {
            socket.send(event.data);
          }
        };

        mediaRecorder.start(500); // Send data every 500ms
        recorder = mediaRecorder;
        isRecording = true;
        addMessage('Started recording - speak now...');

      } catch (error) {
        const err = error instanceof Error ? error : new Error('Unknown recording error');
        addMessage('Failed to start recording: ' + err.message);
      }
    }
  }

  function playAudio(audioData: string): void {
    if (!audioContext) return;

    const audioBuffer = Uint8Array.from(atob(audioData), c => c.charCodeAt(0));
    audioContext.decodeAudioData(audioBuffer.buffer, (buffer) => {
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContext.destination);
      source.start(0);
    });
  }

  onMount(async () => {
    addMessage('Willkommen beim Deutschen Sprachkurs! 👋', 'ai', 'Welcome to the German Language Course!');
    setTimeout(() => {
      addMessage('Bereit für Ihre erste Lektion? Ich bin hier um Ihnen beim Lernen zu helfen.', 'ai',
                 'Ready for your first lesson? I\'m here to help you learn.');
    }, 1000);
  });
</script>

<main class="min-h-screen bg-slate-900 p-6">
  <div class="max-w-6xl mx-auto">
    <Header title={currentLesson.title} userLevel={userLevel} topic={currentLesson.topic} />
    <LessonControls bind:userLevel={userLevel} bind:showTranslation={showTranslation} on:toggleTranslation={() => showTranslation = !showTranslation} lessons={lessons} currentLesson={currentLesson} on:setLesson={handleLessonChange} />
    <ConnectionStatus status={status} isConnected={isConnected} on:toggleConnection={toggleConnection} />
    <ChatArea messages={messages} isRecording={isRecording} isAiThinking={isAiThinking} />
    <Controls isConnected={isConnected} isRecording={isRecording} on:toggleRecording={toggleRecording} />
    <DebugInfo audioContext={audioContext} micStream={micStream} messages={messages} />
  </div>
</main>
