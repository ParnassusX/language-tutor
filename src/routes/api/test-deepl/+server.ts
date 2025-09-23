import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { withDeepLTimeout, TimeoutError } from '$lib/utils/timeout';
// Dynamic DeepL translator initialization (for Railway deployment)
function getDeepLTranslator(): deepl.Translator | null {
    const apiKey = process.env.DEEPL_API_KEY;
    if (!apiKey) return null;
    try {
        return new deepl.Translator(apiKey);
    } catch (error) {
        console.error('Failed to initialize DeepL translator:', error);
        return null;
    }
}

export const POST: RequestHandler = async ({ request }) => {
    const startTime = Date.now();
    
    try {
        const { text, sourceLang, targetLang } = await request.json();
        
        console.log(`[test-deepl] Starting translation test...`);
        console.log(`[test-deepl] Text: "${text}"`);
        console.log(`[test-deepl] Source: ${sourceLang} → Target: ${targetLang}`);
        console.log(`[test-deepl] API Key present: ${process.env.DEEPL_API_KEY ? 'Yes (' + process.env.DEEPL_API_KEY.length + ' chars)' : 'No'}`);
        
        // Validate inputs
        if (!text || typeof text !== 'string') {
            return json({
                success: false,
                error: 'Text is required and must be a string'
            }, { status: 400 });
        }
        
        if (!targetLang || typeof targetLang !== 'string') {
            return json({
                success: false,
                error: 'Target language is required'
            }, { status: 400 });
        }
        
        const translator = getDeepLTranslator();
        if (!translator) {
            return json({
                success: false,
                error: 'DeepL API key not configured'
            }, { status: 500 });
        }

        // Test DeepL translation with timeout
        console.log(`[test-deepl] Calling DeepL API...`);

        const translationPromise = translator.translateText(
            text,
            sourceLang || null,
            targetLang as any // deepl.TargetLanguageCode
        );
        
        const result = await withDeepLTimeout(translationPromise);
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        console.log(`[test-deepl] ✅ Translation completed in ${duration}ms`);
        console.log(`[test-deepl] Result: "${result.text}"`);
        console.log(`[test-deepl] Detected source language: ${result.detectedSourceLang}`);
        console.log(`[test-deepl] Billed characters: ${result.billedCharacters}`);
        
        return json({
            success: true,
            translation: {
                text: result.text,
                detectedSourceLang: result.detectedSourceLang,
                billedCharacters: result.billedCharacters
            },
            performance: {
                duration: duration,
                timeoutLimit: 5000
            },
            metadata: {
                originalText: text,
                sourceLang: sourceLang || 'auto-detect',
                targetLang: targetLang
            }
        });
        
    } catch (error) {
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        console.error(`[test-deepl] ❌ Error after ${duration}ms:`, error);
        
        if (error instanceof TimeoutError) {
            console.error(`[test-deepl] 🕐 DeepL API timed out after ${error.timeoutMs}ms`);
            return json({
                success: false,
                error: 'timeout',
                message: `DeepL translation timed out after ${error.timeoutMs}ms`,
                performance: {
                    duration: duration,
                    timeoutLimit: error.timeoutMs
                }
            }, { status: 408 });
        }
        
        if (error instanceof deepl.DeepLError) {
            console.error(`[test-deepl] 🔑 DeepL API Error:`, error.message);
            return json({
                success: false,
                error: 'deepl_api_error',
                message: error.message,
                performance: {
                    duration: duration
                }
            }, { status: 400 });
        }
        
        return json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
            performance: {
                duration: duration
            }
        }, { status: 500 });
    }
};

export const GET: RequestHandler = async () => {
    return json({
        message: 'DeepL translation test endpoint',
        usage: 'POST with { text: string, sourceLang?: string, targetLang: string }',
        examples: [
            {
                text: 'Hallo Welt',
                sourceLang: 'de',
                targetLang: 'en-US',
                description: 'Translate German to English'
            },
            {
                text: 'Hello world',
                targetLang: 'de',
                description: 'Auto-detect English and translate to German'
            },
            {
                text: 'Wie geht es dir?',
                sourceLang: 'de',
                targetLang: 'en-GB',
                description: 'German to British English'
            }
        ],
        configuration: {
            timeout: '5000ms',
            apiKeyPresent: !!process.env.DEEPL_API_KEY,
            apiKeyLength: process.env.DEEPL_API_KEY?.length || 0
        }
    });
};
