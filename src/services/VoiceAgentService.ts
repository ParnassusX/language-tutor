type EventHandler = (data: any) => void;

export class VoiceAgentService {
  private socket: WebSocket | null = null;
  private isExplicitDisconnect = false;
  private audioContext: AudioContext | null = null;
  private micStream: MediaStream | null = null;
  private recorder: MediaRecorder | null = null;

  private eventHandlers: Map<string, Set<EventHandler>> = new Map();

  constructor() {}

  // --- Event Emitter ---
  on(event: string, handler: EventHandler): () => void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
    return () => this.eventHandlers.get(event)!.delete(handler);
  }

  private emit(event: string, data?: any): void {
    if (this.eventHandlers.has(event)) {
      this.eventHandlers.get(event)!.forEach(handler => handler(data));
    }
  }

  // --- Connection ---
  async connect(): Promise<void> {
    if (typeof window === 'undefined') {
      this.emit('error', new Error('VoiceAgentService can only be used in a browser environment.'));
      return;
    }
    if (this.isConnected()) return;

    this.emit('status', 'Connecting...');

    try {
      const response = await fetch('/api/voice-agent');
      if (!response.ok) {
        throw new Error(`Failed to get connection details: ${response.statusText}`);
      }
      const { token, websocketUrl } = await response.json();

      if (!token || !websocketUrl) {
        throw new Error('Invalid connection details received from API.');
      }

      await this.initAudio();

      const fullWsUrl = `${websocketUrl}?token=${token}`;
      this.socket = new WebSocket(fullWsUrl);
      this.setupSocketHandlers();

      this.isExplicitDisconnect = false;
    } catch (error) {
      this.emit('error', error as Error);
      this.emit('status', 'Connection Failed');
    }
  }

  disconnect(): void {
    this.isExplicitDisconnect = true;
    this.cleanup();
  }

  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  private setupSocketHandlers(): void {
    if (!this.socket) return;

    this.socket.onopen = () => {
      this.emit('connected', {});
      const settings = {
        type: 'Settings',
        language: 'de',
        model: 'nova-3',
        speak: { speed: 0.95, style: 0.8 },
        listen: { endpointing: 300, no_speech_timeout: 2500 },
        think: {
            provider: { type: "google", model: "gemini-1.5-flash" },
            prompt: "You are a friendly and patient German language tutor. Your goal is to help users learn German through natural conversation. Keep responses concise (1-2 sentences). Respond in German unless the user asks for English."
        }
      };
      this.socket?.send(JSON.stringify(settings));
    };

    this.socket.onmessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        this.emit('message', data);
      } catch (error) {
        this.emit('error', new Error('Error processing incoming message.'));
      }
    };

    this.socket.onerror = (event: Event) => {
      this.emit('error', new Error('WebSocket error occurred'));
    };

    this.socket.onclose = () => {
      this.cleanup();
      if (!this.isExplicitDisconnect) {
        this.emit('error', new Error('Connection closed unexpectedly.'));
      }
      this.emit('disconnected', {});
    };
  }

  // --- Audio Handling ---
  private async initAudio(): Promise<void> {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (error) {
      throw new Error('Microphone access denied. Please allow microphone access to use the voice agent.');
    }
  }

  startRecording(): void {
    if (!this.isConnected() || !this.micStream) {
      this.emit('error', new Error('Cannot start recording: not connected or no microphone access.'));
      return;
    }

    try {
      this.recorder = new MediaRecorder(this.micStream, { mimeType: 'audio/webm' });

      this.recorder.ondataavailable = (event) => {
        if (event.data.size > 0 && this.socket?.readyState === WebSocket.OPEN) {
          this.socket.send(event.data);
        }
      };

      this.recorder.start(250); // Send data every 250ms
      this.emit('recording', true);
    } catch (error) {
      this.emit('error', new Error('Failed to start recording.'));
    }
  }

  stopRecording(): void {
    if (this.recorder && this.recorder.state === 'recording') {
      this.recorder.stop();
      this.recorder = null;
      this.emit('recording', false);
    }
  }

  private cleanup(): void {
    if (this.socket) {
      this.socket.onopen = null;
      this.socket.onmessage = null;
      this.socket.onerror = null;
      this.socket.onclose = null;
      if (this.socket.readyState === WebSocket.OPEN) {
        this.socket.close();
      }
      this.socket = null;
    }
    
    this.stopRecording();

    if (this.micStream) {
      this.micStream.getTracks().forEach(track => track.stop());
      this.micStream = null;
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}