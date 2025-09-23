import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import * as deepl from 'deepl-node';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Environment variables
const DEEPL_API_KEY = process.env.DEEPL_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Initialize clients
const translator = new deepl.Translator(DEEPL_API_KEY!);
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY!);

export const POST: RequestHandler = async ({ request }) => {
    console.log('🧪 POST /api/test-pipeline - Testing translation and AI pipeline');

    try {
        const { germanText, topic } = await request.json();
        
        if (!germanText) {
            return json({ error: 'No German text provided' }, { status: 400 });
        }

        console.log(`📝 Testing pipeline for: "${germanText}"`);

        // Step 1: Translate German to English
        console.log('🌍 Step 1: Translating German to English...');
        const englishTranslations = await translator.translateText(germanText, 'de', 'en-US');
        const englishText = Array.isArray(englishTranslations) ? englishTranslations[0].text : englishTranslations.text;
        console.log(`✅ English translation: "${englishText}"`);

        // Step 2: Generate AI response
        console.log('🤖 Step 2: Generating AI response...');
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        
        const systemPrompt = `You are a helpful German language tutor. The user is learning German and has said: "${englishText}". 
        
        Respond in English with:
        1. A brief acknowledgment of what they said
        2. A helpful correction or encouragement if needed
        3. A follow-up question or suggestion to continue the conversation
        
        Keep your response conversational and encouraging, around 2-3 sentences.`;

        const result = await model.generateContent(systemPrompt);
        const aiResponse = result.response.text();
        console.log(`✅ AI response: "${aiResponse}"`);

        // Step 3: Translate AI response back to German
        console.log('🌍 Step 3: Translating AI response to German...');
        const germanResponse = await translator.translateText(aiResponse, 'en', 'de');
        const germanAIResponse = germanResponse.text;
        console.log(`✅ German response: "${germanAIResponse}"`);

        return json({
            success: true,
            originalGerman: germanText,
            englishTranslation: englishText,
            aiResponseEnglish: aiResponse,
            aiResponseGerman: germanAIResponse,
            topic: topic || 'test',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Pipeline test error:', error);
        return json({
            error: 'Pipeline test failed',
            details: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        }, { status: 500 });
    }
};
