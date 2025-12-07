/**
 * Real-Time Voice Session API
 * Start, manage, and stop real-time voice conversations
 * December 2025 - Production-ready voice API
 */

import type { RequestHandler } from '@sveltejs/kit';
import { voiceSessionManager } from '$lib/server/realtime-voice';
import { createLessonRoom } from '$lib/server/livekit-voice';
import { preloadCommonPhrases } from '$lib/server/deepgram-tts';

/**
 * POST /api/voice-session - Start a new real-time voice session
 */
export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const user = locals.user;
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const {
      lessonId,
      voiceContext = 'educational',
      userLevel = 'A2',
    } = body;

    console.log('🎙️ Starting voice session for user:', user.userId);

    // Create LiveKit room
    const room = await createLessonRoom(user.userId, lessonId || 'general', {
      maxParticipants: 2, // User + AI
      emptyTimeout: 900, // 15 minutes
    });

    // Create real-time voice session
    const session = await voiceSessionManager.createSession({
      userId: user.userId,
      lessonId,
      roomName: room.roomName,
      voiceContext,
      userLevel,
    });

    // Preload common phrases for faster responses (async, don't wait)
    preloadCommonPhrases().catch(err =>
      console.error('Error preloading phrases:', err)
    );

    return new Response(
      JSON.stringify({
        success: true,
        session: {
          roomName: room.roomName,
          conversationId: session.getStats().conversationId,
        },
        livekit: {
          url: room.url,
          token: room.token,
        },
        features: {
          deepgramAura2: true,
          streamingTTS: true,
          langGraphAgent: true,
          ragEnabled: true,
          ultraLowLatency: true, // < 300ms total
        },
        instructions: {
          1: 'Connect to LiveKit room using provided token',
          2: 'Enable microphone and start speaking German',
          3: 'AI will respond in real-time (200-300ms latency)',
          4: 'Conversation is automatically saved',
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error starting voice session:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to start voice session',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

/**
 * GET /api/voice-session - Get active session info
 */
export const GET: RequestHandler = async ({ url, locals }) => {
  try {
    const user = locals.user;
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const roomName = url.searchParams.get('roomName');
    if (!roomName) {
      return new Response(
        JSON.stringify({ error: 'roomName query parameter is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const session = voiceSessionManager.getSession(roomName, user.userId);
    
    if (!session) {
      return new Response(
        JSON.stringify({
          active: false,
          message: 'No active session found',
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({
        active: true,
        stats: session.getStats(),
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error getting session info:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to get session info',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

/**
 * DELETE /api/voice-session - End a voice session
 */
export const DELETE: RequestHandler = async ({ request, locals }) => {
  try {
    const user = locals.user;
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const { roomName } = body;

    if (!roomName) {
      return new Response(
        JSON.stringify({ error: 'roomName is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('🛑 Ending voice session:', roomName);

    // End session
    await voiceSessionManager.endSession(roomName, user.userId);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Voice session ended successfully',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error ending voice session:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to end voice session',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
