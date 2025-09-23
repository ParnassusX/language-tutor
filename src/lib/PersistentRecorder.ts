/**
 * Persistent Audio Recorder with Voice Activity Detection
 * Manages continuous audio recording with automatic segmentation based on speech detection
 */

import { VoiceActivityDetector, createVAD, type VADCallbacks } from './VoiceActivityDetector.js';

export interface RecorderConfig {
  /** Audio constraints for MediaRecorder */
  audioConstraints: MediaStreamConstraints['audio'];
  /** Maximum recording duration per segment (ms) */
  maxSegmentDuration: number;
  /** Minimum recording duration to process (ms) */
  minRecordingDuration: number;
  /** MIME type for MediaRecorder */
  mimeType: string;
}

export interface RecorderCallbacks {
  onRecordingStart?: () => void;
  onRecordingStop?: (audioBlob: Blob, duration: number) => void;
  onVolumeChange?: (volume: number) => void;
  onError?: (error: Error) => void;
  onStatusChange?: (status: RecorderStatus) => void;
}

export enum RecorderStatus {
  IDLE = 'idle',
  INITIALIZING = 'initializing',
  LISTENING = 'listening',
  RECORDING = 'recording',
  PROCESSING = 'processing',
  ERROR = 'error'
}

export class PersistentRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private vad: VoiceActivityDetector | null = null;
  private stream: MediaStream | null = null;
  private audioChunks: Blob[] = [];
  private recordingStartTime = 0;
  private segmentStartTime = 0;
  private maxSegmentTimer: number | null = null;
  
  private status: RecorderStatus = RecorderStatus.IDLE;
  private config: RecorderConfig;
  private callbacks: RecorderCallbacks;
  
  constructor(config: Partial<RecorderConfig> = {}, callbacks: RecorderCallbacks = {}) {
    this.config = {
      audioConstraints: {
        sampleRate: 16000,
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      },
      maxSegmentDuration: 30000, // 30 seconds max per segment
      minRecordingDuration: 500,  // 500ms minimum
      mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/wav',
      ...config
    };
    
    this.callbacks = callbacks;
  }
  
  /**
   * Initialize the persistent recorder
   */
  async initialize(): Promise<void> {
    try {
      this.setStatus(RecorderStatus.INITIALIZING);
      
      // Request microphone access
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: this.config.audioConstraints
      });
      
      // Initialize MediaRecorder
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: this.config.mimeType
      });
      
      this.setupMediaRecorderEvents();
      
      // Initialize Voice Activity Detection
      const vadCallbacks: VADCallbacks = {
        onSpeechStart: () => this.handleSpeechStart(),
        onSpeechEnd: () => this.handleSpeechEnd(),
        onVolumeChange: (volume) => this.callbacks.onVolumeChange?.(volume),
        onError: (error) => this.handleError(error)
      };
      
      this.vad = createVAD(vadCallbacks);
      await this.vad.initialize(this.stream);
      
      this.setStatus(RecorderStatus.LISTENING);
      console.log('🎙️ Persistent recorder initialized');
      
    } catch (error) {
      const err = new Error(`Failed to initialize recorder: ${error instanceof Error ? error.message : 'Unknown error'}`);
      this.handleError(err);
      throw err;
    }
  }
  
  /**
   * Start persistent listening (VAD monitoring)
   */
  start(): void {
    if (!this.vad) {
      throw new Error('Recorder not initialized. Call initialize() first.');
    }
    
    if (this.status !== RecorderStatus.LISTENING) {
      throw new Error(`Cannot start from status: ${this.status}`);
    }
    
    this.vad.start();
    console.log('👂 Persistent listening started');
  }
  
  /**
   * Stop persistent listening and any active recording
   */
  stop(): void {
    if (this.vad) {
      this.vad.stop();
    }
    
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop();
    }
    
    this.clearMaxSegmentTimer();
    this.setStatus(RecorderStatus.IDLE);
    console.log('⏹️ Persistent listening stopped');
  }
  
  /**
   * Destroy the recorder and clean up resources
   */
  destroy(): void {
    this.stop();
    
    if (this.vad) {
      this.vad.destroy();
      this.vad = null;
    }
    
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    
    this.mediaRecorder = null;
    this.audioChunks = [];
    
    console.log('🗑️ Persistent recorder destroyed');
  }
  
  /**
   * Get current recorder status
   */
  getStatus(): RecorderStatus {
    return this.status;
  }
  
  /**
   * Get current audio level (0-100)
   */
  getCurrentLevel(): number {
    return this.vad?.getCurrentLevel() || 0;
  }
  
  /**
   * Check if currently speaking
   */
  getIsSpeaking(): boolean {
    return this.vad?.getIsSpeaking() || false;
  }
  
  /**
   * Update VAD configuration
   */
  updateVADConfig(config: Parameters<VoiceActivityDetector['updateConfig']>[0]): void {
    this.vad?.updateConfig(config);
  }
  
  /**
   * Handle speech start event from VAD
   */
  private handleSpeechStart(): void {
    if (!this.mediaRecorder || this.status !== RecorderStatus.LISTENING) {
      return;
    }
    
    try {
      this.audioChunks = [];
      this.recordingStartTime = Date.now();
      this.segmentStartTime = Date.now();
      
      this.mediaRecorder.start();
      this.setStatus(RecorderStatus.RECORDING);
      this.callbacks.onRecordingStart?.();
      
      // Set maximum segment duration timer
      this.maxSegmentTimer = window.setTimeout(() => {
        this.handleSpeechEnd();
      }, this.config.maxSegmentDuration);
      
      console.log('🔴 Recording started (speech detected)');
      
    } catch (error) {
      this.handleError(new Error(`Failed to start recording: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  }
  
  /**
   * Handle speech end event from VAD
   */
  private handleSpeechEnd(): void {
    if (!this.mediaRecorder || this.status !== RecorderStatus.RECORDING) {
      return;
    }
    
    try {
      this.mediaRecorder.stop();
      this.clearMaxSegmentTimer();
      console.log('⏸️ Recording stopped (speech ended)');
      
    } catch (error) {
      this.handleError(new Error(`Failed to stop recording: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  }
  
  /**
   * Setup MediaRecorder event handlers
   */
  private setupMediaRecorderEvents(): void {
    if (!this.mediaRecorder) return;
    
    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.audioChunks.push(event.data);
      }
    };
    
    this.mediaRecorder.onstop = () => {
      this.setStatus(RecorderStatus.PROCESSING);
      
      const duration = Date.now() - this.recordingStartTime;
      
      // Check minimum duration
      if (duration < this.config.minRecordingDuration) {
        console.log(`⚠️ Recording too short (${duration}ms), discarding`);
        this.setStatus(RecorderStatus.LISTENING);
        return;
      }
      
      // Create audio blob
      const audioBlob = new Blob(this.audioChunks, { type: this.config.mimeType });
      
      // Notify callback
      this.callbacks.onRecordingStop?.(audioBlob, duration);
      
      // Reset for next recording
      this.audioChunks = [];
      this.setStatus(RecorderStatus.LISTENING);
      
      console.log(`✅ Recording processed: ${duration}ms, ${audioBlob.size} bytes`);
    };
    
    this.mediaRecorder.onerror = (event) => {
      this.handleError(new Error(`MediaRecorder error: ${event}`));
    };
  }
  
  /**
   * Set recorder status and notify callback
   */
  private setStatus(status: RecorderStatus): void {
    if (this.status !== status) {
      this.status = status;
      this.callbacks.onStatusChange?.(status);
    }
  }
  
  /**
   * Handle errors
   */
  private handleError(error: Error): void {
    console.error('🚨 Persistent recorder error:', error);
    this.setStatus(RecorderStatus.ERROR);
    this.callbacks.onError?.(error);
  }
  
  /**
   * Clear the maximum segment timer
   */
  private clearMaxSegmentTimer(): void {
    if (this.maxSegmentTimer) {
      clearTimeout(this.maxSegmentTimer);
      this.maxSegmentTimer = null;
    }
  }
}
