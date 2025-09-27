class TimeoutError extends Error {
  constructor(message, timeoutMs) {
    super(message);
    this.timeoutMs = timeoutMs;
    this.name = "TimeoutError";
  }
}
function promiseWithTimeout(promise, timeoutMs, timeoutError) {
  const timeout = new Promise((_, reject) => {
    setTimeout(() => {
      const error = timeoutError || new TimeoutError(
        `Promise timed out after ${timeoutMs}ms`,
        timeoutMs
      );
      reject(error);
    }, timeoutMs);
  });
  return Promise.race([promise, timeout]);
}
const TIMEOUT_CONFIG = {
  DEEPL_TRANSLATION: 5e3,
  // 5 seconds - DeepL is typically fast
  GEMINI_AI: 3e4,
  // 30 seconds - AI generation can take longer
  DEEPGRAM_TRANSCRIBE: 1e4,
  // 10 seconds - Speech-to-text processing
  DEEPGRAM_SPEAK: 8e3,
  // 8 seconds - Text-to-speech generation
  DEFAULT_API: 15e3
  // 15 seconds - Default for other API calls
};
function withDeepLTimeout(promise) {
  return promiseWithTimeout(
    promise,
    TIMEOUT_CONFIG.DEEPL_TRANSLATION,
    new TimeoutError("DeepL translation timed out", TIMEOUT_CONFIG.DEEPL_TRANSLATION)
  );
}
function withGeminiTimeout(promise) {
  return promiseWithTimeout(
    promise,
    TIMEOUT_CONFIG.GEMINI_AI,
    new TimeoutError("Gemini AI response timed out", TIMEOUT_CONFIG.GEMINI_AI)
  );
}
export {
  TimeoutError as T,
  withGeminiTimeout as a,
  TIMEOUT_CONFIG as b,
  promiseWithTimeout as p,
  withDeepLTimeout as w
};
