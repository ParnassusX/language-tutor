/**
 * Agentic Chat API using LangGraph
 * Stateful, multi-step agentic workflows for language tutoring
 * December 2025 - State-of-the-art agentic AI
 */

import type { RequestHandler } from '@sveltejs/kit';
import { executeLanguageTutorAgent } from '$lib/server/langgraph-agent';

/**
 * POST /api/agentic-chat - Execute LangGraph agent for tutoring
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
    const { message, lessonId, conversationId } = body;

    if (!message) {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('🤖 Executing LangGraph agentic workflow...');

    // Execute the agent
    const result = await executeLanguageTutorAgent(
      user.userId,
      message,
      lessonId,
      conversationId
    );

    return new Response(
      JSON.stringify({
        success: true,
        response: result.response,
        corrections: result.corrections,
        conversationId: result.conversationId,
        agentType: 'langgraph',
        features: {
          stateful: true,
          multiStep: true,
          contextAware: true,
          ragEnabled: true,
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in agentic chat:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to process message',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
