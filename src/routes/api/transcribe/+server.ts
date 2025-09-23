import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createClient } from '@deepgram/sdk';
import * as deepl from 'deepl-node';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Content } from '@google/generative-ai';
import {
    DEEPGRAM_API_KEY,
    DEEPL_API_KEY,
    GEMINI_API_KEY
} from '$env/static/private';

// Add logging to check for API keys
console.log('DEEPGRAM_API_KEY available:', !!DEEPGRAM_API_KEY);
console.log('DEEPL_API_KEY available:', !!DEEPL_API_KEY);
console.log('GEMINI_API_KEY available:', !!GEMINI_API_KEY);
console.log('Using in-memory store for Railway (KV_URL removed)');

import type { DeepgramClient } from '@deepgram/sdk';

// Initialize APIs dynamically (for Railway deployment)
function getDeepgramClient(): DeepgramClient | null {
	if (!DEEPGRAM_API_KEY) return null;
	return createClient(DEEPGRAM_API_KEY);
}

function getTranslator(): deepl.Translator | null {
	if (!DEEPL_API_KEY) return null;
	try {
		return new deepl.Translator(DEEPL_API_KEY);
	} catch (error) {
		console.error('Failed to initialize DeepL translator:', error);
		return null;
	}
}

function getGeminiAI(): GoogleGenerativeAI | null {
	if (!GEMINI_API_KEY) return null;
	return new GoogleGenerativeAI(GEMINI_API_KEY);
}

// In-memory store as a fallback for Vercel KV
const memoryStore = new Map<string, Content[]>();

export const POST: RequestHandler = async ({ request }) => {
    const action = request.headers.get('X-Action');
    const userId = 'user_123'; // In a real app, you'd get this from the session

    if (action === 'clear') {
        try {
            memoryStore.delete(userId);
            return json({ status: 'success', message: 'History cleared.' });
        } catch (err) {
            const error = err as Error;
            console.error('Error clearing history:', error.message);
            return json({ status: 'error', message: 'Failed to clear history.' }, { status: 500 });
        }
    }

	const { audio: audioBase64, topic } = await request.json();
	const audioBuffer = Buffer.from(audioBase64.split(',')[1], 'base64');

	try {
		const deepgram = getDeepgramClient();
		const translator = getTranslator();
		const genAI = getGeminiAI();

		if (!deepgram || !translator || !genAI) {
			throw new Error('One or more API clients failed to initialize.');
		}

		const { result: transcriptionResult, error } = await deepgram.listen.prerecorded.transcribeFile(
			audioBuffer,
			{
				model: 'nova-2',
				language: 'de', // Transcribe German
				smart_format: true
			}
		);

		if (error) {
			throw new Error(error.message);
		}

		const transcription = transcriptionResult.results.channels[0].alternatives[0].transcript;

		const translationResult = await translator.translateText(transcription, 'de', 'en-US');
		const englishText = translationResult.text;

		// Read memory from memory store (for Railway deployment)
		let history: Content[] = memoryStore.get(userId) || [];

		const model = genAI.getGenerativeModel({
			model: 'gemini-1.5-flash',
			generationConfig: { responseMimeType: 'application/json' }
		});

		const systemPrompt = getSystemPrompt(topic);
		const chat = model.startChat({
			history: [
				{ role: 'user', parts: [{ text: systemPrompt }] },
				{ role: 'model', parts: [{ text: 'Okay, I am ready and will respond in JSON.' }] },
				...history
			]
		});

		const result = await chat.sendMessage(englishText);
		const responseText = result.response.text();
		const responseObject = JSON.parse(responseText);

		const { response: llmResponse, languageTip } = responseObject;

		// Update memory in memory store (for Railway deployment)
		memoryStore.set(userId, await chat.getHistory());

		const germanTranslationResult = await translator.translateText(llmResponse, 'en', 'de');
		const germanTranslation = Array.isArray(germanTranslationResult)
			? germanTranslationResult.map((r) => r.text).join(' ')
			: germanTranslationResult.text;

		return json({
			status: 'success',
			transcription: transcription,
			englishText: llmResponse,
			germanTranslation: germanTranslation,
			languageTip: languageTip
		});
	} catch (err) {
		const error = err as Error;
		console.error('Error transcribing audio:', error.message);
		return json(
			{
				status: 'error',
				message: 'Failed to transcribe audio.'
			},
			{ status: 500 }
		);
	}
};

function getSystemPrompt(topic: string): string {
	const basePrompt = `You are an expert language tutor system. Your student is a native German speaker learning English.
  Your goal is to have a natural conversation while also providing a helpful language tip.
  You MUST respond with a JSON object containing two keys: "response" and "languageTip".
  - "response": A conversational reply to the user's message. Keep it to 1-2 sentences.
  - "languageTip": A simple, encouraging tip based on the user's message. This could be a grammar correction, a vocabulary suggestion, or an alternative phrasing. Keep it to 1-2 sentences.`;

	switch (topic) {
		case 'Ordering at a Restaurant':
			return `${basePrompt} The user wants to practice ordering at a restaurant. You are the waiter. Start by asking what they would like to order.`;
		case 'Asking for Directions':
			return `${basePrompt} The user wants to practice asking for directions. You are a helpful local in a German city. The user is a tourist who is lost.`;
		case 'At the Airport':
			return `${basePrompt} The user wants to practice checking in at an airport. You are the check-in agent. Be polite and efficient.`;
		default:
			return `${basePrompt} The topic is general conversation.`;
	}
}
