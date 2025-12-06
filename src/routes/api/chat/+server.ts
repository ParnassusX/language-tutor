/**
 * Modern Chat API with Streaming Support
 * Real-time AI responses for language learning
 */

import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import type { RequestHandler } from '@sveltejs/kit';
import { generateTutorResponse, analyzeGermanText } from '$lib/server/ai-tutor';
import { env } from '$env/dynamic/private';

/**
 * POST /api/chat - Generate AI tutor response
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
    const { message, lessonId, conversationId, streaming = false } = body;

    if (!message) {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // For streaming responses
    if (streaming) {
      const model = openai('gpt-4-turbo-preview');
      
      const result = streamText({
        model,
        messages: [
          {
            role: 'system',
            content: `You are a helpful German language tutor. Respond in German unless asked for English. Keep responses concise and encouraging.`,
          },
          {
            role: 'user',
            content: message,
          },
        ],
        temperature: 0.7,
        maxTokens: 200,
      });

      // Return streaming response
      return result.toDataStreamResponse();
    }

    // For non-streaming responses
    const response = await generateTutorResponse({
      userId: user.userId,
      lessonId,
      userMessage: message,
      conversationId,
      useStreaming: false,
    });

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate response',
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
 * PUT /api/chat - Analyze German text
 */
export const PUT: RequestHandler = async ({ request, locals }) => {
  try {
    const user = locals.user;
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const { text } = body;

    if (!text) {
      return new Response(JSON.stringify({ error: 'Text is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const analysis = await analyzeGermanText(text, user.userId);

    return new Response(JSON.stringify(analysis), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Text analysis error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to analyze text',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
