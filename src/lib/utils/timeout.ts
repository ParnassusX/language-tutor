/**
 * Promise timeout utility for preventing API calls from hanging indefinitely
 * Based on Promise.race() pattern for robust timeout handling
 */

export class TimeoutError extends Error {
    constructor(message: string, public readonly timeoutMs: number) {
        super(message);
        this.name = 'TimeoutError';
    }
}

/**
 * Wraps a promise with a timeout, rejecting if the promise doesn't resolve within the specified time
 * @param promise The promise to wrap with timeout
 * @param timeoutMs Timeout in milliseconds
 * @param timeoutError Optional custom error to throw on timeout
 * @returns Promise that resolves with the original promise result or rejects with timeout error
 */
export function promiseWithTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    timeoutError?: Error
): Promise<T> {
    // Create a promise that rejects after the specified timeout
    const timeout = new Promise<never>((_, reject) => {
        setTimeout(() => {
            const error = timeoutError || new TimeoutError(
                `Promise timed out after ${timeoutMs}ms`,
                timeoutMs
            );
            reject(error);
        }, timeoutMs);
    });

    // Return a race between the original promise and the timeout
    return Promise.race<T>([promise, timeout]);
}

/**
 * Predefined timeout configurations for different API services
 */
export const TIMEOUT_CONFIG = {
    DEEPL_TRANSLATION: 5000,      // 5 seconds - DeepL is typically fast
    GEMINI_AI: 30000,             // 30 seconds - AI generation can take longer
    DEEPGRAM_TRANSCRIBE: 10000,   // 10 seconds - Speech-to-text processing
    DEEPGRAM_SPEAK: 8000,         // 8 seconds - Text-to-speech generation
    DEFAULT_API: 15000            // 15 seconds - Default for other API calls
} as const;

/**
 * Convenience wrapper for DeepL translation API calls
 */
export function withDeepLTimeout<T>(promise: Promise<T>): Promise<T> {
    return promiseWithTimeout(
        promise,
        TIMEOUT_CONFIG.DEEPL_TRANSLATION,
        new TimeoutError('DeepL translation timed out', TIMEOUT_CONFIG.DEEPL_TRANSLATION)
    );
}

/**
 * Convenience wrapper for Google Gemini AI API calls
 */
export function withGeminiTimeout<T>(promise: Promise<T>): Promise<T> {
    return promiseWithTimeout(
        promise,
        TIMEOUT_CONFIG.GEMINI_AI,
        new TimeoutError('Gemini AI response timed out', TIMEOUT_CONFIG.GEMINI_AI)
    );
}

/**
 * Convenience wrapper for Deepgram transcription API calls
 */
export function withDeepgramTranscribeTimeout<T>(promise: Promise<T>): Promise<T> {
    return promiseWithTimeout(
        promise,
        TIMEOUT_CONFIG.DEEPGRAM_TRANSCRIBE,
        new TimeoutError('Deepgram transcription timed out', TIMEOUT_CONFIG.DEEPGRAM_TRANSCRIBE)
    );
}

/**
 * Convenience wrapper for Deepgram text-to-speech API calls
 */
export function withDeepgramSpeakTimeout<T>(promise: Promise<T>): Promise<T> {
    return promiseWithTimeout(
        promise,
        TIMEOUT_CONFIG.DEEPGRAM_SPEAK,
        new TimeoutError('Deepgram text-to-speech timed out', TIMEOUT_CONFIG.DEEPGRAM_SPEAK)
    );
}

/**
 * Generic API timeout wrapper with configurable timeout
 */
export function withApiTimeout<T>(promise: Promise<T>, timeoutMs: number, serviceName?: string): Promise<T> {
    const errorMessage = serviceName 
        ? `${serviceName} API timed out after ${timeoutMs}ms`
        : `API call timed out after ${timeoutMs}ms`;
    
    return promiseWithTimeout(
        promise,
        timeoutMs,
        new TimeoutError(errorMessage, timeoutMs)
    );
}
