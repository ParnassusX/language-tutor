// This endpoint provides connection details for Deepgram Voice Agents
// Based on Deepgram's official Voice Agent playground examples

import { DEEPGRAM_API_KEY } from '$env/static/private';

// Validate environment variables
if (!DEEPGRAM_API_KEY) {
  console.error('DEEPGRAM_API_KEY is not set in environment variables');
  throw new Error('Server configuration error: Missing required API key');
}

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

export const GET = async () => {
  // Generate a Deepgram session token for Voice Agent WebSocket
  console.log('🎯 Voice Agent token requested');

  try {
    // Create a Deepgram session for Voice Agent
    const response = await fetch('https://api.deepgram.com/v1/agent/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${DEEPGRAM_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(GERMAN_TUTOR_CONFIG.agent)
    });

    if (!response.ok) {
      console.error('Deepgram session creation failed:', response.status, response.statusText);
      return createErrorResponse(500, 'Failed to create Deepgram session');
    }

    const sessionData = await response.json();
    console.log('🎵 Deepgram session created:', sessionData);

    return new Response(JSON.stringify({
      token: sessionData.token,
      sessionId: sessionData.session_id,
      expiresAt: sessionData.expires_at,
      config: GERMAN_TUTOR_CONFIG
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Access-Control-Allow-Origin': '*',
      }
    });
  } catch (error) {
    console.error('Error creating Deepgram session:', error);
    return createErrorResponse(500, 'Failed to create Voice Agent session');
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
