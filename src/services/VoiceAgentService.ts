import { browser } from '$app/environment';

type MessageHandler = (data: any) => void;
type ErrorHandler = (error: Error) => void;

export class VoiceAgentService {
  private socket: WebSocket | null = null;
  private messageHandlers: Set<MessageHandler> = new Set();
  private errorHandlers: Set<ErrorHandler> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // 1 second
  private isExplicitDisconnect = false;
  private audioContext: AudioContext | null = null;
  private audioInput: MediaStreamAudioSourceNode | null = null;
  private processor: ScriptProcessorNode | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: BlobPart[] = [];

  constructor(private wsUrl: string = 'ws://localhost:6000/api/voice-agent') {}

  async connect(): Promise<void> {
    if (!browser) {
      throw new Error('VoiceAgentService can only be used in the browser');
    }

    if (this.isConnected()) {
      return;
    }

    try {
      this.socket = new WebSocket(this.wsUrl);
      this.setupSocketHandlers();
      await this.setupAudio();
      this.isExplicitDisconnect = false;
      this.reconnectAttempts = 0;
    } catch (error) {
      this.handleError(error as Error);
      throw error;
    }
  }

  private setupSocketHandlers(): void {
    if (!this.socket) return;

    this.socket.onopen = () => {
      console.log('WebSocket connection established');
      this.reconnectAttempts = 0;
    };

    this.socket.onmessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        this.messageHandlers.forEach(handler => handler(data));
      } catch (error) {
        console.error('Error processing message:', error);
        this.handleError(error as Error);
      }
    };

    this.socket.onerror = (event: Event) => {
      console.error('WebSocket error:', event);
      this.handleError(new Error('WebSocket error occurred'));
    };

    this.socket.onclose = () => {
      console.log('WebSocket connection closed');
      this.cleanup();
      
      if (!this.isExplicitDisconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnect();
      }
    };
  }

  private async setupAudio(): Promise<void> {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      this.audioInput = this.audioContext.createMediaStreamSource(stream);
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);
      
      this.processor.onaudioprocess = (e) => {
        if (!this.isConnected()) return;
        
        const inputData = e.inputBuffer.getChannelData(0);
        this.sendAudioData(inputData);
      };
      
      this.audioInput.connect(this.processor);
      this.processor.connect(this.audioContext.destination);
      
      // Setup media recorder for full audio capture
      this.mediaRecorder = new MediaRecorder(stream);
      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          this.audioChunks.push(e.data);
        }
      };
      
      this.mediaRecorder.start(100); // Collect data every 100ms
      
    } catch (error) {
      console.error('Error setting up audio:', error);
      this.handleError(error as Error);
      throw error;
    }
  }

  sendAudioData(data: Float32Array): void {
    if (!this.isConnected()) {
      console.warn('Cannot send audio data: WebSocket not connected');
      return;
    }
    
    try {
      // Convert Float32 to Int16 for smaller payload
      const int16Data = this.floatTo16BitPCM(data);
      this.socket?.send(int16Data.buffer);
    } catch (error) {
      console.error('Error sending audio data:', error);
      this.handleError(error as Error);
    }
  }

  private floatTo16BitPCM(input: Float32Array): Int16Array {
    const output = new Int16Array(input.length);
    for (let i = 0; i < input.length; i++) {
      const s = Math.max(-1, Math.min(1, input[i]));
      output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return output;
  }

  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  onError(handler: ErrorHandler): () => void {
    this.errorHandlers.add(handler);
    return () => this.errorHandlers.delete(handler);
  }

  private handleError(error: Error): void {
    console.error('VoiceAgentService error:', error);
    this.errorHandlers.forEach(handler => handler(error));
  }

  private reconnect(): void {
    this.reconnectAttempts++;
    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
    
    setTimeout(() => {
      if (!this.isExplicitDisconnect) {
        this.connect().catch(error => {
          console.error('Reconnection failed:', error);
        });
      }
    }, this.reconnectDelay * this.reconnectAttempts);
  }

  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  disconnect(): void {
    this.isExplicitDisconnect = true;
    this.cleanup();
  }

  private cleanup(): void {
    // Close WebSocket
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

    // Clean up audio
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    
    if (this.audioInput) {
      this.audioInput.disconnect();
      this.audioInput = null;
    }
    
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
      this.mediaRecorder = null;
    }
    
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    this.audioChunks = [];
  }

  async getRecordedAudio(): Promise<Blob | null> {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.requestData();
        await new Promise(resolve => {
          const checkChunks = () => {
            if (this.audioChunks.length > 0) {
              resolve(null);
            } else {
              setTimeout(checkChunks, 100);
            }
          };
          checkChunks();
        });
      } catch (error) {
        console.error('Error getting recorded audio:', error);
        this.handleError(error as Error);
      }
    }
    
    return this.audioChunks.length > 0 
      ? new Blob(this.audioChunks, { type: 'audio/wav' })
      : null;
  }
}
