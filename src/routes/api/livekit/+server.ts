/**
 * LiveKit API Endpoint
 * Creates zero-latency voice rooms for language learning
 */

import type { RequestHandler } from '@sveltejs/kit';
import {
  createLessonRoom,
  endLessonRoom,
  getLiveKitConfig,
  getAIAgentConfig,
  createDeepgramBridge,
  getOptimalVADConfig,
} from '$lib/server/livekit-voice';

/**
 * POST /api/livekit - Create a new voice lesson room
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
    const { lessonId, maxParticipants, emptyTimeout } = body;

    // Create LiveKit room
    const room = await createLessonRoom(user.userId, lessonId, {
      maxParticipants,
      emptyTimeout,
    });

    // Get optimized configuration
    const config = getLiveKitConfig(room.token, room.roomName);
    const aiConfig = getAIAgentConfig();
    const deepgramBridge = createDeepgramBridge(room.roomName);
    const vadConfig = getOptimalVADConfig();

    return new Response(
      JSON.stringify({
        success: true,
        room: {
          name: room.roomName,
          url: room.url,
          token: room.token,
        },
        config,
        aiConfig,
        deepgramBridge,
        vadConfig,
        features: {
          zeroLatency: true,
          deepgramFreeTier: true,
          geminiFreeTier: true,
          agenticWorkflow: true,
          voiceActivityDetection: true,
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error creating LiveKit room:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to create voice room',
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
 * DELETE /api/livekit - End a voice lesson room
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

    await endLessonRoom(roomName);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Room ended successfully',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error ending LiveKit room:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to end room',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
