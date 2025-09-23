import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { promiseWithTimeout, TimeoutError, TIMEOUT_CONFIG } from '$lib/utils/timeout';

export const POST: RequestHandler = async ({ request }) => {
    try {
        const { testType, delay } = await request.json();
        
        console.log(`[test-timeout] Testing timeout utility - Type: ${testType}, Delay: ${delay}ms`);
        
        switch (testType) {
            case 'success':
                // Test successful promise that completes before timeout
                const successPromise = new Promise<string>((resolve) => {
                    setTimeout(() => resolve('Success!'), delay || 1000);
                });
                
                const successResult = await promiseWithTimeout(
                    successPromise,
                    3000, // 3 second timeout
                    new TimeoutError('Test timeout', 3000)
                );
                
                return json({
                    success: true,
                    result: successResult,
                    message: 'Promise completed successfully before timeout'
                });
                
            case 'timeout':
                // Test promise that times out
                const slowPromise = new Promise<string>((resolve) => {
                    setTimeout(() => resolve('Too slow!'), delay || 5000);
                });
                
                try {
                    await promiseWithTimeout(
                        slowPromise,
                        2000, // 2 second timeout
                        new TimeoutError('Test timeout occurred', 2000)
                    );
                    
                    return json({
                        success: false,
                        error: 'Promise should have timed out but did not'
                    });
                } catch (error) {
                    if (error instanceof TimeoutError) {
                        return json({
                            success: true,
                            result: 'timeout_caught',
                            message: `Timeout correctly caught: ${error.message}`,
                            timeoutMs: error.timeoutMs
                        });
                    }
                    throw error;
                }
                
            case 'deepl_simulation':
                // Simulate DeepL API call with timeout
                const deeplSimulation = new Promise<string>((resolve) => {
                    setTimeout(() => resolve('Translated text'), delay || 2000);
                });
                
                const deeplResult = await promiseWithTimeout(
                    deeplSimulation,
                    TIMEOUT_CONFIG.DEEPL_TRANSLATION,
                    new TimeoutError('DeepL simulation timeout', TIMEOUT_CONFIG.DEEPL_TRANSLATION)
                );
                
                return json({
                    success: true,
                    result: deeplResult,
                    message: `DeepL simulation completed in ${delay}ms (timeout: ${TIMEOUT_CONFIG.DEEPL_TRANSLATION}ms)`
                });
                
            case 'gemini_simulation':
                // Simulate Gemini AI call with timeout
                const geminiSimulation = new Promise<string>((resolve) => {
                    setTimeout(() => resolve('AI generated response'), delay || 10000);
                });
                
                const geminiResult = await promiseWithTimeout(
                    geminiSimulation,
                    TIMEOUT_CONFIG.GEMINI_AI,
                    new TimeoutError('Gemini simulation timeout', TIMEOUT_CONFIG.GEMINI_AI)
                );
                
                return json({
                    success: true,
                    result: geminiResult,
                    message: `Gemini simulation completed in ${delay}ms (timeout: ${TIMEOUT_CONFIG.GEMINI_AI}ms)`
                });
                
            default:
                return json({
                    success: false,
                    error: 'Invalid test type. Use: success, timeout, deepl_simulation, or gemini_simulation'
                }, { status: 400 });
        }
        
    } catch (error) {
        console.error('[test-timeout] Error:', error);
        
        if (error instanceof TimeoutError) {
            return json({
                success: false,
                error: 'timeout',
                message: error.message,
                timeoutMs: error.timeoutMs
            }, { status: 408 });
        }
        
        return json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        }, { status: 500 });
    }
};

export const GET: RequestHandler = async () => {
    return json({
        message: 'Timeout utility test endpoint',
        usage: 'POST with { testType: "success|timeout|deepl_simulation|gemini_simulation", delay?: number }',
        examples: [
            { testType: 'success', delay: 1000, description: 'Promise completes in 1s (before 3s timeout)' },
            { testType: 'timeout', delay: 5000, description: 'Promise takes 5s but times out at 2s' },
            { testType: 'deepl_simulation', delay: 2000, description: 'Simulate DeepL API call' },
            { testType: 'gemini_simulation', delay: 10000, description: 'Simulate Gemini AI call' }
        ]
    });
};
