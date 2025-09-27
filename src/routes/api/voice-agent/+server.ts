// This endpoint provides connection details for Deepgram Voice Agents
// Based on Deepgram's official Voice Agent playground examples

import { env } from '$env/dynamic/private';

// We'll validate environment variables inside the endpoints where needed

// Helper function to create error responses
function createErrorResponse(status: number, message: string) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

// German Language Tutor Voice Agent Configuration
const GERMAN_TUTOR_CONFIG = {
  "type": "Settings",
  "audio": {
    "input": {
      "encoding": "linear16",
      "sample_rate": 48000,
      "channels": 1
    },
    "output": {
      "encoding": "linear16",
      "sample_rate": 24000,
      "container": "none"
    },
    "dtx": true // Enable discontinuous transmission for better performance
  },
  "agent": {
    "language": "de",
    "model": "aura-2-en", // UNIFIED Deepgram Aura 2 - handles both STT and TTS natively
    "speak": {
      "speed": 0.95, // Slightly slower for learning comprehension
      "style": 0.8 // More expressive for engaging teaching
    },
    "listen": {
      "endpointing": 300, // Faster response detection
      "no_speech_timeout": 2500, // Allow thinking time for learners
      "keywords": [
        { "word": "Hallo", "boost": 1.8 },
        { "word": "Danke", "boost": 1.8 },
        { "word": "Bitte", "boost": 1.8 },
        { "word": "Wiederholen", "boost": 2.5 },
        { "word": "Langsamer", "boost": 2.5 },
        { "word": "Englisch", "boost": 2.0 },
        { "word": "Entschuldigung", "boost": 1.5 }
      ]
    },
  "think": {
    "provider": {
      "type": "google",
      "model": "gemini-1.5-flash",
      "temperature": 0.7,
      "max_tokens": 150,
      "presence_penalty": 0.0,
      "frequency_penalty": 0.0
    },
      "prompt": `# Role: German Language Tutor

You are a friendly and patient German language tutor. Your goal is to help users learn German through natural conversation.

## Guidelines:
- Respond in German unless the user asks for English
- Keep responses concise (1-2 sentences)
- If user makes mistakes, gently correct them
- Ask follow-up questions to continue the conversation
- Adjust difficulty based on user's level
- Provide cultural context when relevant
- Use simple vocabulary for beginners
- For advanced users, introduce idioms and complex grammar

## Conversation Flow:
1. Start with a friendly greeting in German
2. Ask about their day or a simple question
3. Continue the conversation naturally
4. Provide feedback on their German
5. End with a clear closing phrase

## Special Commands:
- If user says "Englisch", provide an English translation
- If user says "Langsamer", speak more slowly
- If user says "Wiederholen", repeat your last response

## Example Dialogues:
User: Guten Morgen!
Tutor: Guten Morgen! Wie geht es Ihnen heute? (Good morning! How are you today?)

User: Ich heiße [Name].
Tutor: Schön, Sie kennenzulernen, [Name]! Woher kommen Sie? (Nice to meet you, [Name]! Where are you from?)
- Never interrupt - let users complete their thoughts
- Correct gently and provide better alternatives

#Topics: Greetings, daily activities, food, directions, numbers, weather

#Always start conversations warmly and be supportive!`
    },
    "greeting": "Hallo! Ich bin dein deutscher Sprachlehrer. Wie kann ich dir heute helfen? Sprich einfach auf Deutsch mit mir!"
  }
};

export const GET = async (request) => {
  // Check if user requests transcription-only mode
  const url = new URL(request.url);
  const mode = url.searchParams.get('mode') || 'voice-agent';

  console.log(`🎯 ${mode === 'transcription' ? 'Transcription-only' : 'Voice Agent'} configuration requested`);

  try {
    if (mode === 'transcription') {
      // Fallback mode for transcription only (works even without Voice Agent)
      return new Response(JSON.stringify({
        status: 'success',
        mode: 'transcription',
        token: env.DEEPGRAM_API_KEY,
        message: 'Transcription-only mode ready (Voice Agent not enabled)',
        websocketUrl: 'wss://api.deepgram.com/v1/listen',
        config: {
          language: 'de',
          model: 'nova-2',  // Use standard transcription model
          smart_format: true,
          punctuate: true,
          interim_results: true
        },
        fallbackMode: true,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Access-Control-Allow-Origin': '*',
        }
      });
    } else {
      // Primary Voice Agent mode
      return new Response(JSON.stringify({
        status: 'success',
        mode: 'voice-agent',
        token: env.DEEPGRAM_API_KEY,  // Use API key directly as token for WebSocket auth
        message: 'Voice Agent ready for WebSocket connection',
        websocketUrl: 'wss://api.deepgram.com/v1/listen/agent',
        config: GERMAN_TUTOR_CONFIG.agent,
        fallbackUrl: `http://localhost:5173/api/voice-agent?mode=transcription`,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hour expiration
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Access-Control-Allow-Origin': '*',
        }
      });
    }
  } catch (error) {
    console.error('Error generating Voice Agent config:', error);
    return createErrorResponse(500, 'Failed to generate Voice Agent configuration');
  }
};

// Optional: POST for session management
export const POST = async () => {
  try {
    // Generate a unique session ID
    const sessionId = crypto.randomUUID();
    
    // Return the configuration with the session ID
    return new Response(JSON.stringify({
      status: 'success',
      message: 'Voice Agent session created',
      note: 'Use GET /api/voice-agent for configuration, then connect to WebSocket',
      sessionId,
      config: {
        ...GERMAN_TUTOR_CONFIG,
        session: {
          session_id: sessionId,
          expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour expiration
        }
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Access-Control-Allow-Origin': '*',
      }
    });
  } catch (error) {
    console.error('Error generating session:', error);
    return createErrorResponse(500, 'Failed to generate session');
  }
};
