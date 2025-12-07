/**
 * Deepgram Aura 2 TTS Integration
 * Real-time streaming Text-to-Speech with ultra-low latency
 * December 2025 - Latest TTS technology
 */

import { createClient, LiveTTSEvents } from '@deepgram/sdk';
import { env } from '$env/dynamic/private';

// Deepgram client singleton
let deepgramClient: ReturnType<typeof createClient> | null = null;

/**
 * Get or create Deepgram client
 */
function getDeepgramClient() {
  if (!deepgramClient) {
    const apiKey = env.DEEPGRAM_API_KEY;
    if (!apiKey) {
      throw new Error('DEEPGRAM_API_KEY is required for voice features');
    }
    deepgramClient = createClient(apiKey);
  }
  return deepgramClient;
}

/**
 * Voice options for different contexts
 */
export const DEEPGRAM_VOICES = {
  // Educational voices (recommended for language learning)
  educational_female: 'aura-luna-en', // Friendly, clear, patient
  educational_male: 'aura-perseus-en', // Clear, professional, warm
  
  // Conversational voices
  conversational_female: 'aura-asteria-en', // Warm, natural
  conversational_male: 'aura-orion-en', // Friendly, approachable
  
  // Professional voices
  professional_female: 'aura-stella-en', // Clear, authoritative
  professional_male: 'aura-arcas-en', // Deep, confident
  
  // Expressive voices
  expressive_female: 'aura-hera-en', // Dynamic, engaging
  expressive_male: 'aura-orpheus-en', // Dramatic, expressive
} as const;

export type DeepgramVoice = typeof DEEPGRAM_VOICES[keyof typeof DEEPGRAM_VOICES];

/**
 * TTS Configuration
 */
export interface TTSConfig {
  voice?: DeepgramVoice;
  speed?: number; // 0.5 to 2.0
  sampleRate?: 8000 | 16000 | 24000 | 48000;
  encoding?: 'linear16' | 'mp3' | 'opus';
  language?: 'de' | 'en' | 'es' | 'fr';
}

/**
 * Generate speech from text (non-streaming)
 * Use for short responses or pre-generation
 */
export async function generateSpeech(
  text: string,
  config: TTSConfig = {}
): Promise<Buffer> {
  const client = getDeepgramClient();
  
  const {
    voice = DEEPGRAM_VOICES.educational_female,
    speed = 1.0,
    sampleRate = 48000,
    encoding = 'linear16',
  } = config;
  
  try {
    const response = await client.speak.request(
      { text },
      {
        model: voice,
        encoding: encoding,
        sample_rate: sampleRate,
        container: 'wav',
      }
    );
    
    // Get audio buffer
    const stream = await response.getStream();
    if (!stream) {
      throw new Error('No audio stream received from Deepgram');
    }
    
    const chunks: Buffer[] = [];
    const reader = stream.getReader();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(Buffer.from(value));
    }
    
    return Buffer.concat(chunks);
  } catch (error) {
    console.error('Error generating speech:', error);
    throw new Error(`TTS generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Create a streaming TTS connection
 * Returns connection object for real-time streaming
 */
export function createStreamingTTS(config: TTSConfig = {}) {
  const client = getDeepgramClient();
  
  const {
    voice = DEEPGRAM_VOICES.educational_female,
    sampleRate = 48000,
    encoding = 'linear16',
  } = config;
  
  // Create live TTS connection
  const connection = client.speak.live({
    model: voice,
    encoding: encoding,
    sample_rate: sampleRate,
  });
  
  return connection;
}

/**
 * Streaming TTS with event handlers
 * Processes text chunks and streams audio in real-time
 */
export interface StreamingTTSHandler {
  onAudio: (audioChunk: Uint8Array) => void;
  onMetadata?: (metadata: any) => void;
  onWarning?: (warning: any) => void;
  onError?: (error: Error) => void;
  onClose?: () => void;
}

export class StreamingTTSSession {
  private connection: any;
  private isOpen = false;
  
  constructor(
    private config: TTSConfig = {},
    private handlers: StreamingTTSHandler
  ) {
    this.connection = createStreamingTTS(config);
    this.setupHandlers();
  }
  
  private setupHandlers() {
    this.connection.on(LiveTTSEvents.Open, () => {
      console.log('🎙️ Deepgram TTS connection opened');
      this.isOpen = true;
    });
    
    this.connection.on(LiveTTSEvents.Audio, (data: Uint8Array) => {
      this.handlers.onAudio(data);
    });
    
    this.connection.on(LiveTTSEvents.Metadata, (metadata: any) => {
      if (this.handlers.onMetadata) {
        this.handlers.onMetadata(metadata);
      }
    });
    
    this.connection.on(LiveTTSEvents.Warning, (warning: any) => {
      console.warn('Deepgram TTS warning:', warning);
      if (this.handlers.onWarning) {
        this.handlers.onWarning(warning);
      }
    });
    
    this.connection.on(LiveTTSEvents.Error, (error: any) => {
      console.error('Deepgram TTS error:', error);
      if (this.handlers.onError) {
        this.handlers.onError(error);
      }
    });
    
    this.connection.on(LiveTTSEvents.Close, () => {
      console.log('🔚 Deepgram TTS connection closed');
      this.isOpen = false;
      if (this.handlers.onClose) {
        this.handlers.onClose();
      }
    });
  }
  
  /**
   * Send text to be synthesized
   * Text will be streamed as audio in real-time
   */
  async sendText(text: string): Promise<void> {
    if (!this.isOpen) {
      throw new Error('TTS connection is not open');
    }
    
    try {
      this.connection.sendText(text);
    } catch (error) {
      console.error('Error sending text to TTS:', error);
      throw error;
    }
  }
  
  /**
   * Send text in chunks for lower latency
   * User starts hearing audio after first chunk
   */
  async sendTextChunked(text: string): Promise<void> {
    // Split by sentences for natural pauses
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    
    for (const sentence of sentences) {
      await this.sendText(sentence.trim());
      // Small delay between sentences for natural flow
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }
  
  /**
   * Flush and finish
   */
  async finish(): Promise<void> {
    if (this.isOpen) {
      this.connection.finish();
    }
  }
  
  /**
   * Close the connection
   */
  close(): void {
    if (this.isOpen) {
      this.connection.requestClose();
    }
  }
}

/**
 * Cache for frequently used phrases
 * Reduces latency for common responses
 */
class TTSCache {
  private cache = new Map<string, Buffer>();
  private maxSize = 100; // Maximum cached items
  
  get(key: string): Buffer | undefined {
    return this.cache.get(key);
  }
  
  set(key: string, audio: Buffer): void {
    if (this.cache.size >= this.maxSize) {
      // Remove oldest item
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, audio);
  }
  
  has(key: string): boolean {
    return this.cache.has(key);
  }
}

export const ttsCache = new TTSCache();

/**
 * Generate speech with caching
 * Caches common phrases for instant responses
 */
export async function generateSpeechCached(
  text: string,
  config: TTSConfig = {}
): Promise<Buffer> {
  const cacheKey = `${text}_${config.voice || 'default'}_${config.speed || 1.0}`;
  
  // Check cache first
  if (ttsCache.has(cacheKey)) {
    console.log('✨ Using cached TTS for:', text.substring(0, 50));
    return ttsCache.get(cacheKey)!;
  }
  
  // Generate and cache
  const audio = await generateSpeech(text, config);
  ttsCache.set(cacheKey, audio);
  
  return audio;
}

/**
 * Preload common German phrases
 * Call during application startup
 */
export async function preloadCommonPhrases(
  voice?: DeepgramVoice
): Promise<void> {
  const commonPhrases = [
    'Guten Tag!',
    'Wie geht es dir?',
    'Sehr gut!',
    'Lass uns das korrigieren.',
    'Perfekt!',
    'Noch einmal, bitte.',
    'Ausgezeichnet!',
    'Weiter so!',
    'Danke!',
    'Auf Wiedersehen!',
  ];
  
  console.log('🔄 Preloading common TTS phrases...');
  
  await Promise.all(
    commonPhrases.map(phrase =>
      generateSpeechCached(phrase, { voice })
    )
  );
  
  console.log('✅ Preloaded', commonPhrases.length, 'common phrases');
}

/**
 * Get optimal voice for context
 */
export function getVoiceForContext(
  context: 'educational' | 'conversational' | 'professional' | 'expressive',
  gender: 'male' | 'female' = 'female'
): DeepgramVoice {
  const key = `${context}_${gender}` as keyof typeof DEEPGRAM_VOICES;
  return DEEPGRAM_VOICES[key] || DEEPGRAM_VOICES.educational_female;
}

/**
 * Adjust speed based on user level
 */
export function getSpeedForLevel(level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'): number {
  const speeds = {
    A1: 0.85, // Slower for beginners
    A2: 0.90,
    B1: 0.95,
    B2: 1.00, // Natural speed
    C1: 1.05,
    C2: 1.10, // Slightly faster for advanced
  };
  return speeds[level] || 1.0;
}
