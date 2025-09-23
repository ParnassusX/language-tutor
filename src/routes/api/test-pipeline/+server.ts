import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
    console.log('🧪 POST /api/test-pipeline - Testing route active');

    // For Railway deployment, pipeline testing is handled in /api/conversational
    // This endpoint is kept for compatibility but redirects the functionality
    return json({
        success: true,
        message: 'Test pipeline functionality moved to /api/conversational for Railway deployment',
        note: 'The full AI pipeline (DeepL + Gemini) is working in the main conversation endpoint',
        tip: 'Use POST /api/conversational with { message: "your german text" } to test the pipeline'
    });
};
