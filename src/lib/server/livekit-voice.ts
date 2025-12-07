/**
 * LiveKit Real-Time Voice Integration
 * Zero-latency voice calls for language learning
 * December 2025 - Ultra-low latency voice infrastructure
 */

import { AccessToken, RoomServiceClient } from 'livekit-server-sdk';
import { env } from '$env/dynamic/private';

// LiveKit configuration
const LIVEKIT_URL = env.LIVEKIT_URL || 'ws://localhost:7880';
const LIVEKIT_API_KEY = env.LIVEKIT_API_KEY || '';
const LIVEKIT_API_SECRET = env.LIVEKIT_API_SECRET || '';

/**
 * Generate LiveKit access token for a user
 * Provides secure, time-limited access to voice rooms
 */
export async function generateLiveKitToken(
  userId: string,
  roomName: string,
  userName?: string
): Promise<string> {
  const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
    identity: userId,
    name: userName || `user_${userId}`,
    ttl: '24h', // Token valid for 24 hours
  });

  // Grant permissions
  at.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  });

  return at.toJwt();
}

/**
 * Create a LiveKit room for a lesson
 */
export async function createLessonRoom(
  userId: string,
  lessonId: string,
  options?: {
    maxParticipants?: number;
    emptyTimeout?: number;
  }
): Promise<{
  roomName: string;
  token: string;
  url: string;
}> {
  const roomName = `lesson_${lessonId}_${userId}_${Date.now()}`;
  
  // Initialize room service client
  const roomService = new RoomServiceClient(LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET);
  
  try {
    // Create room with options
    await roomService.createRoom({
      name: roomName,
      emptyTimeout: options?.emptyTimeout || 300, // 5 minutes default
      maxParticipants: options?.maxParticipants || 2, // User + AI
    });
    
    console.log(`✅ Created LiveKit room: ${roomName}`);
  } catch (error) {
    // Room might already exist, which is fine for our use case
    if (error instanceof Error && error.message.includes('already exists')) {
      console.log(`Room ${roomName} already exists, reusing...`);
    } else {
      console.error('Error creating LiveKit room:', error);
      throw error;
    }
  }
  
  // Generate token for user
  const token = await generateLiveKitToken(userId, roomName, `Student ${userId}`);
  
  return {
    roomName,
    token,
    url: LIVEKIT_URL,
  };
}

/**
 * End a lesson room
 */
export async function endLessonRoom(roomName: string): Promise<void> {
  const roomService = new RoomServiceClient(LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET);
  
  try {
    await roomService.deleteRoom(roomName);
    console.log(`✅ Deleted LiveKit room: ${roomName}`);
  } catch (error) {
    console.error('Error deleting room:', error);
  }
}

/**
 * Get room participants
 */
export async function getRoomParticipants(roomName: string) {
  const roomService = new RoomServiceClient(LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET);
  
  try {
    const participants = await roomService.listParticipants(roomName);
    return participants;
  } catch (error) {
    console.error('Error getting participants:', error);
    return [];
  }
}

/**
 * LiveKit configuration info for clients
 */
export interface LiveKitConfig {
  url: string;
  token: string;
  roomName: string;
  features: {
    autoGainControl: boolean;
    echoCancellation: boolean;
    noiseSuppression: boolean;
    sampleRate: number;
  };
}

/**
 * Get optimized LiveKit configuration for language learning
 */
export function getLiveKitConfig(token: string, roomName: string): LiveKitConfig {
  return {
    url: LIVEKIT_URL,
    token,
    roomName,
    features: {
      autoGainControl: true,
      echoCancellation: true,
      noiseSuppression: true,
      sampleRate: 48000, // High quality for pronunciation clarity
    },
  };
}

/**
 * AI Agent configuration for LiveKit
 * This would integrate with Deepgram/OpenAI for real-time transcription
 */
export interface AIAgentConfig {
  transcriptionProvider: 'deepgram' | 'openai';
  ttsProvider: 'deepgram' | 'openai' | 'elevenlabs';
  language: string;
  voiceId?: string;
  enableInterruptions: boolean;
}

/**
 * Get AI agent configuration optimized for German tutoring
 */
export function getAIAgentConfig(): AIAgentConfig {
  return {
    transcriptionProvider: 'deepgram', // Free tier available!
    ttsProvider: 'deepgram', // Aura 2 for natural German
    language: 'de',
    enableInterruptions: true, // Allow natural conversation flow
  };
}

/**
 * Integration point for Deepgram with LiveKit
 * Uses Deepgram's free tier for transcription
 */
export interface DeepgramLiveKitBridge {
  roomName: string;
  deepgramApiKey: string;
  model: string;
  language: string;
}

export function createDeepgramBridge(roomName: string): DeepgramLiveKitBridge {
  const apiKey = env.DEEPGRAM_API_KEY;
  if (!apiKey) {
    throw new Error('DEEPGRAM_API_KEY is required for voice features');
  }
  
  return {
    roomName,
    deepgramApiKey: apiKey,
    model: 'nova-2', // Latest Deepgram model (free tier)
    language: 'de',
  };
}

/**
 * Real-time transcription webhook handler
 * Processes Deepgram transcriptions from LiveKit audio
 */
export async function handleTranscriptionWebhook(
  roomName: string,
  transcription: string,
  userId: string
): Promise<void> {
  console.log(`📝 Transcription in ${roomName}: ${transcription}`);
  
  // Here you would:
  // 1. Send transcription to LangGraph agent for processing
  // 2. Get AI response
  // 3. Send response back to LiveKit room via TTS
  
  // This enables zero-latency conversation flow:
  // User speaks → LiveKit → Deepgram (free tier) → LangGraph agent → TTS → LiveKit → User hears
}

/**
 * Voice Activity Detection (VAD) configuration
 * Optimized for natural conversation flow
 */
export interface VADConfig {
  enabled: boolean;
  threshold: number; // 0-1, lower = more sensitive
  prefix_padding_ms: number;
  silence_duration_ms: number;
}

export function getOptimalVADConfig(): VADConfig {
  return {
    enabled: true,
    threshold: 0.5, // Balanced sensitivity for German pronunciation
    prefix_padding_ms: 300, // Include 300ms before speech
    silence_duration_ms: 700, // Wait 700ms of silence before ending
  };
}
