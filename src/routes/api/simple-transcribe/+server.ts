import { json } from '@sveltejs/kit';

// Simplified transcription API for debugging Railway deployment
// This bypasses complex API integrations to test if deployment works

export const POST = async ({ request }) => {
	try {
		const { audio: audioData, topic = 'General Conversation' } = await request.json();

		// Mock transcription response for testing Railway deployment
		// Replace with real Deepgram integration once deployment works
		const mockResponse = {
			status: 'success',
			transcription: 'Mock transcription: Ich spreche Deutsch.',
			englishText: 'I am speaking German. Please correct my pronunciation and grammar.',
			germanTranslation: 'Ich spreche Deutsch. Bitte korrigieren Sie meine Aussprache und Grammatik.',
			languageTip: 'Try to roll your "r" sound more when saying "sprechen". This is characteristic of German pronunciation.',
			disclaimer: 'This is a mock response. Railway deployment is working, but real Deepgram API needs valid credentials.'
		};

		console.log('✅ Simple transcription working on Railway:', {
			environment: process.env.RAILWAY_ENVIRONMENT_NAME ? 'Railway' : 'Other',
			timestamp: new Date().toISOString(),
			hasAudio: !!audioData
		});

		return json(mockResponse);
	} catch (error) {
		console.error('Simple transcription error:', error);
		return json({
			status: 'error',
			message: 'Deployment test failed',
			details: error instanceof Error ? error.message : 'Unknown error'
		}, { status: 500 });
	}
};
