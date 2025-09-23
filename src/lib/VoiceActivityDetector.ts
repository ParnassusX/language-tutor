/**
 * Voice Activity Detection (VAD) using Web Audio API
 * Detects speech activity in real-time audio streams
 */

export interface VADConfig {
  /** Minimum audio level to consider as potential speech (0-255) */
  threshold: number;
  /** Minimum duration of silence before considering speech ended (ms) */
  silenceDuration: number;
  /** Minimum duration of speech before considering it valid (ms) */
  speechDuration: number;
  /** Sample rate for analysis (Hz) */
  sampleRate: number;
  /** FFT size for frequency analysis */
  fftSize: number;
  /** Smoothing factor for audio level averaging (0-1) */
  smoothingTimeConstant: number;
}

export interface VADCallbacks {
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
  onVolumeChange?: (volume: number) => void;
  onError?: (error: Error) => void;
}

export class VoiceActivityDetector {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private dataArray: Uint8Array | null = null;
  private animationFrame: number | null = null;
  
  private isSpeaking = false;
  private lastSpeechTime = 0;
  private lastSilenceTime = 0;
  private speechStartTime = 0;
  
  private config: VADConfig;
  private callbacks: VADCallbacks;
  
  constructor(config: Partial<VADConfig> = {}, callbacks: VADCallbacks = {}) {
    this.config = {
      threshold: 30,
      silenceDuration: 1000, // 1 second
      speechDuration: 300,   // 300ms
      sampleRate: 16000,
      fftSize: 2048,
      smoothingTimeConstant: 0.8,
      ...config
    };
    
    this.callbacks = callbacks;
  }
  
  /**
   * Initialize VAD with a media stream
   */
  async initialize(stream: MediaStream): Promise<void> {
    try {
      // Create audio context with specified sample rate
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: this.config.sampleRate
      });
      
      // Create analyser node for frequency analysis
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = this.config.fftSize;
      this.analyser.smoothingTimeConstant = this.config.smoothingTimeConstant;
      
      // Create source node from media stream
      this.sourceNode = this.audioContext.createMediaStreamSource(stream);
      this.sourceNode.connect(this.analyser);
      
      // Initialize data array for frequency data
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      
      console.log('🎤 VAD initialized:', {
        sampleRate: this.audioContext.sampleRate,
        fftSize: this.analyser.fftSize,
        frequencyBinCount: this.analyser.frequencyBinCount
      });
      
    } catch (error) {
      const err = new Error(`Failed to initialize VAD: ${error instanceof Error ? error.message : 'Unknown error'}`);
      this.callbacks.onError?.(err);
      throw err;
    }
  }
  
  /**
   * Start voice activity detection
   */
  start(): void {
    if (!this.analyser || !this.dataArray) {
      throw new Error('VAD not initialized. Call initialize() first.');
    }
    
    this.lastSilenceTime = Date.now();
    this.analyze();
    console.log('🔍 VAD started');
  }
  
  /**
   * Stop voice activity detection
   */
  stop(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    
    if (this.isSpeaking) {
      this.isSpeaking = false;
      this.callbacks.onSpeechEnd?.();
    }
    
    console.log('⏹️ VAD stopped');
  }
  
  /**
   * Clean up resources
   */
  destroy(): void {
    this.stop();
    
    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    this.analyser = null;
    this.dataArray = null;
    
    console.log('🗑️ VAD destroyed');
  }
  
  /**
   * Get current audio level (0-100)
   */
  getCurrentLevel(): number {
    if (!this.analyser || !this.dataArray) return 0;
    
    this.analyser.getByteFrequencyData(this.dataArray);
    
    // Calculate RMS (Root Mean Square) for better voice detection
    let sum = 0;
    for (let i = 0; i < this.dataArray.length; i++) {
      sum += this.dataArray[i] * this.dataArray[i];
    }
    const rms = Math.sqrt(sum / this.dataArray.length);
    
    // Convert to 0-100 scale
    return Math.min(100, (rms / 255) * 100);
  }
  
  /**
   * Check if currently speaking
   */
  getIsSpeaking(): boolean {
    return this.isSpeaking;
  }
  
  /**
   * Update VAD configuration
   */
  updateConfig(newConfig: Partial<VADConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (this.analyser && newConfig.smoothingTimeConstant !== undefined) {
      this.analyser.smoothingTimeConstant = newConfig.smoothingTimeConstant;
    }
    
    console.log('⚙️ VAD config updated:', this.config);
  }
  
  /**
   * Main analysis loop
   */
  private analyze(): void {
    if (!this.analyser || !this.dataArray) return;
    
    // Get current audio level
    const currentLevel = this.getCurrentLevel();
    this.callbacks.onVolumeChange?.(currentLevel);
    
    const now = Date.now();
    const isAboveThreshold = currentLevel > this.config.threshold;
    
    if (isAboveThreshold) {
      this.lastSpeechTime = now;
      
      // Check if we should start speech detection
      if (!this.isSpeaking) {
        if (this.speechStartTime === 0) {
          this.speechStartTime = now;
        } else if (now - this.speechStartTime >= this.config.speechDuration) {
          this.isSpeaking = true;
          this.callbacks.onSpeechStart?.();
          console.log('🗣️ Speech started');
        }
      }
    } else {
      this.lastSilenceTime = now;
      this.speechStartTime = 0; // Reset speech start timer
      
      // Check if we should end speech detection
      if (this.isSpeaking && now - this.lastSpeechTime >= this.config.silenceDuration) {
        this.isSpeaking = false;
        this.callbacks.onSpeechEnd?.();
        console.log('🤫 Speech ended');
      }
    }
    
    // Continue analysis
    this.animationFrame = requestAnimationFrame(() => this.analyze());
  }
}

/**
 * Create a VAD instance with default settings optimized for speech detection
 */
export function createVAD(callbacks: VADCallbacks = {}): VoiceActivityDetector {
  return new VoiceActivityDetector({
    threshold: 25,           // Sensitive enough for normal speech
    silenceDuration: 1500,   // 1.5 seconds of silence to end speech
    speechDuration: 200,     // 200ms of speech to start detection
    sampleRate: 16000,       // Standard for speech processing
    fftSize: 2048,           // Good balance of frequency resolution and performance
    smoothingTimeConstant: 0.8 // Smooth out rapid fluctuations
  }, callbacks);
}
