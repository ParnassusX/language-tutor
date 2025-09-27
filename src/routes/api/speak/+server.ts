import type { RequestHandler } from './$types';
import { createClient } from '@deepgram/sdk';
import { env } from '$env/dynamic/private';

export const POST: RequestHandler = async ({ request }) => {
  const DEEPGRAM_API_KEY = env.DEEPGRAM_API_KEY;

  if (!DEEPGRAM_API_KEY) {
    return new Response('Deepgram API key not configured', { status: 500 });
  }

  const { text } = await request.json();

  if (!text) {
    return new Response('Missing text in request body', { status: 400 });
  }

  try {
    const deepgram = createClient(DEEPGRAM_API_KEY);

    const response = await deepgram.speak.request(
      { text },
      {
        model: 'aura-asteria-en', // A high-quality, conversational English voice
      }
    );

    const stream = await response.getStream();
    if (!stream) {
      throw new Error('Failed to get audio stream.');
    }

    return new Response(stream, {
      headers: {
        'Content-Type': 'audio/mpeg',
      },
    });

  } catch (err) {
    const error = err as Error;
    console.error('Error generating audio:', error.message);
    return new Response('Failed to generate audio.', { status: 500 });
  }
};
