import { createClient } from '@deepgram/sdk';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';

// TTSFM - Free TTS Service (OpenAI-compatible)
class TTSFMClient {
    constructor() {
        this.baseUrl = 'https://www.openai.fm';
        this.apiUrl = 'https://api.openai.fm';
    }

    async textToSpeech(text, options = {}) {
        try {
            const { voice = 'alloy', speed = 1.0 } = options;

            const response = await fetch(`${this.apiUrl}/v1/audio/speech`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini-tts',
                    input: text,
                    voice: voice,
                    speed: speed,
                    response_format: 'mp3'
                })
            });

            if (!response.ok) {
                throw new Error(`TTSFM API error: ${response.status}`);
            }

            const audioData = await response.arrayBuffer();
            return Buffer.from(audioData);
        } catch (error) {
            console.warn('TTSFM TTS failed:', error.message);
            throw error;
        }
    }

    // Voice mapping for compatibility with Deepgram
    getCompatibleVoice(deepgramVoice) {
        const voiceMap = {
            'aura-asteria-en': 'alloy',
            'aura-arcas-de': 'alloy', // Use alloy for German as well since TTSFM has limited German voices
            'aura-luna-en': 'alloy',
            'aura-stella-en': 'alloy',
        };
        return voiceMap[deepgramVoice] || 'alloy';
    }
}

// Initialize TTSFM client
const ttsfmClient = new TTSFMClient();

// Load environment variables from the root directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

if (!process.env.DEEPGRAM_API_KEY) {
    console.error('DEEPGRAM_API_KEY is not set in environment variables');
    throw new Error('DEEPGRAM_API_KEY is required');
}

// Initialize Deepgram with API key
const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

/**
 * Generate speech from text using TTSFM (free) as primary, Deepgram as fallback
 * @param {string} text - The text to convert to speech
 * @param {Object} options - TTS options
 * @param {string} [options.voice='aura-asteria-en'] - Voice model to use
 * @param {number} [options.speed=1.0] - Speech rate (0.5 to 2.0)
 * @param {boolean} [options.forceDeepgram=false] - Force Deepgram usage
 * @returns {Promise<ReadableStream>} - Stream of audio data
 */
export async function textToSpeech(text, options = {}) {
    const {
        voice = 'aura-asteria-en',
        speed = 1.0,
        forceDeepgram = false
    } = options;

    // Try TTSFM first (free) unless explicitly forcing Deepgram
    if (!forceDeepgram) {
        try {
            console.log('🎤 Attempting TTS with TTSFM (free service)...');
            const ttsfmVoice = ttsfmClient.getCompatibleVoice(voice);
            const audioBuffer = await ttsfmClient.textToSpeech(text, {
                voice: ttsfmVoice,
                speed: speed
            });

            // Convert buffer to stream
            const { Readable } = require('stream');
            const stream = new Readable();
            stream.push(audioBuffer);
            stream.push(null);

            console.log('✅ TTSFM TTS successful');
            return stream;
        } catch (error) {
            console.warn('⚠️ TTSFM failed, falling back to Deepgram:', error.message);
            // Continue to Deepgram fallback
        }
    }

    // Deepgram fallback
    try {
        console.log('🎤 Using Deepgram TTS as fallback...');
        // Request TTS from Deepgram using the new SDK format
                const response = await fetch('https://api.deepgram.com/v1/speak', {
            method: 'POST',
            headers: {
                'Authorization': `Token ${process.env.DEEPGRAM_API_KEY}`,
                'Content-Type': 'application/json',
            },
                        body: JSON.stringify({
                text: text,
                model: voice, // The 'voice' option corresponds to the 'model' in the API
                speed: speed,
                encoding: 'linear16',
                container: 'wav'
            })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Deepgram API error: ${response.status} - ${error}`);
        }

        // Get the audio data as a buffer
        const audioData = await response.arrayBuffer();

        // Convert to a Node.js stream for compatibility
        const { Readable } = require('stream');
        const stream = new Readable();
        stream.push(Buffer.from(audioData));
        stream.push(null); // End the stream

        console.log('✅ Deepgram TTS successful');
        return stream;
    } catch (error) {
        console.error('❌ Error generating speech with both TTSFM and Deepgram:', error);
        throw new Error('Failed to generate speech with both services');
    }
}

/**
 * Get available Deepgram Aura voices
 * @returns {Promise<Array<Object>>} - List of available voices
 */
export async function getAvailableVoices() {
    // This is a simplified example - you might need to adjust based on the actual API
    // For now, we'll return a list of available Aura voices
    return [
        { id: 'aura-asteria-en', name: 'Asteria', language: 'en-US', gender: 'female' },
        { id: 'aura-luna-en', name: 'Luna', language: 'en-US', gender: 'female' },
        { id: 'aura-stella-en', name: 'Stella', language: 'en-US', gender: 'female' },
        { id: 'aura-orion-en', name: 'Orion', language: 'en-US', gender: 'male' },
        { id: 'aura-seren-en', name: 'Seren', language: 'en-US', gender: 'male' },
        { id: 'aura-arcas-de', name: 'Arcas', language: 'de-DE', gender: 'male' },
        { id: 'aura-orion-de', name: 'Orion', language: 'de-DE', gender: 'male' },
        { id: 'aura-asteria-de', name: 'Asteria', language: 'de-DE', gender: 'female' },
        { id: 'aura-luna-de', name: 'Luna', language: 'de-DE', gender: 'female' }
    ];
}
