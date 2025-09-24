// This endpoint provides connection details for Deepgram Voice Agents
// Based on Deepgram's official Voice Agent playground examples

import { json } from '@sveltejs/kit';
import { DEEPGRAM_API_KEY } from '$env/static/private';

// German Language Tutor Voice Agent Configuration
const GERMAN_TUTOR_CONFIG = {
  "type": "Settings",
  "audio": {
    "input": {
      "encoding": "linear16",
      "sample_rate": 48000
    },
    "output": {
      "encoding": "linear16",
      "sample_rate": 24000,
      "container": "none"
    }
  },
  "agent": {
    "language": "de",
    "speak": {
      "provider": {
        "type": "deepgram",
        "model": "aura-2-vesta-en" // German voice model
      }
    },
    "listen": {
      "provider": {
        "type": "deepgram",
        "model": "nova-2-general" // German transcription model
      },
      "keywords": ["Hallo", "Danke", "Bitte", "Entschuldigung", "Verstehen", "Wiederholen"]
    },
    "think": {
      "provider": {
        "type": "openai", // Using OpenAI as Gemini quota issues
        "model": "gpt-4o-mini"
      },
      "prompt": `#Role: German Language Tutor

You are a fun, encouraging German language tutor. Help users learn German through natural conversation.

#Guidelines:
- Always respond in German unless the user asks for English translation
- Provide encouraging feedback on pronunciation and grammar
- Ask follow-up questions to continue conversation
- Keep responses conversational (1-2 sentences)
- Use simple German vocabulary appropriate for learner level
- Never interrupt - let users complete their thoughts
- Correct gently and provide better alternatives

#Topics: Greetings, daily activities, food, directions, numbers, weather

#Always start conversations warmly and be supportive!`
    },
    "greeting": "Hallo! Ich bin dein deutscher Sprachlehrer. Wie kann ich dir heute helfen? Sprich einfach auf Deutsch mit mir!"
  }
};

export const GET = async () => {
  // Return the Voice Agent configuration
  // In production, this would generate a live session URL

  console.log('🎯 Voice Agent configuration requested');

  try {
    return json({
      status: 'success',
      type: 'voice_agent_config',
      config: GERMAN_TUTOR_CONFIG,
      websocket_url: `wss://agent.deepgram.com/agent`,
      api_key_exists: !!DEEPGRAM_API_KEY,
      instructions: {
        client_setup: 'Connect to websocket_url with Authorization: Bearer your_api_key',
        message_format: 'Send Settings object first, then audio data',
        expected_flow: 'Greeting → Conversation → Natural language practice'
      }
    });
  } catch (error) {
    console.error('Voice Agent config error:', error);
    return json({
      status: 'error',
      message: 'Failed to generate Voice Agent config'
    }, { status: 500 });
  }
};

// Optional: POST for session management
export const POST = async () => {
  return json({
    status: 'success',
    message: 'Voice Agent session created',
    note: 'Use GET /api/voice-agent for configuration, then connect to WebSocket'
  });
};
