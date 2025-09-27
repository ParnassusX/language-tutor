import { j as json } from "../../../../chunks/index2.js";
import { w as withDeepLTimeout, T as TimeoutError } from "../../../../chunks/timeout.js";
import * as deepl from "deepl-node";
const translator = new deepl.Translator(process.env.DEEPL_API_KEY || "");
const POST = async ({ request }) => {
  const startTime = Date.now();
  try {
    const { text, sourceLang, targetLang } = await request.json();
    console.log(`[test-deepl] Starting translation test...`);
    console.log(`[test-deepl] Text: "${text}"`);
    console.log(`[test-deepl] Source: ${sourceLang} → Target: ${targetLang}`);
    console.log(`[test-deepl] API Key present: ${process.env.DEEPL_API_KEY ? "Yes (" + process.env.DEEPL_API_KEY.length + " chars)" : "No"}`);
    if (!text || typeof text !== "string") {
      return json({
        success: false,
        error: "Text is required and must be a string"
      }, { status: 400 });
    }
    if (!targetLang || typeof targetLang !== "string") {
      return json({
        success: false,
        error: "Target language is required"
      }, { status: 400 });
    }
    console.log(`[test-deepl] Calling DeepL API...`);
    const translationPromise = translator.translateText(
      text,
      sourceLang || null,
      targetLang
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
        duration,
        timeoutLimit: 5e3
      },
      metadata: {
        originalText: text,
        sourceLang: sourceLang || "auto-detect",
        targetLang
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
        error: "timeout",
        message: `DeepL translation timed out after ${error.timeoutMs}ms`,
        performance: {
          duration,
          timeoutLimit: error.timeoutMs
        }
      }, { status: 408 });
    }
    if (error instanceof deepl.DeepLError) {
      console.error(`[test-deepl] 🔑 DeepL API Error:`, error.message);
      return json({
        success: false,
        error: "deepl_api_error",
        message: error.message,
        performance: {
          duration
        }
      }, { status: 400 });
    }
    return json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      performance: {
        duration
      }
    }, { status: 500 });
  }
};
const GET = async () => {
  return json({
    message: "DeepL translation test endpoint",
    usage: "POST with { text: string, sourceLang?: string, targetLang: string }",
    examples: [
      {
        text: "Hallo Welt",
        sourceLang: "de",
        targetLang: "en-US",
        description: "Translate German to English"
      },
      {
        text: "Hello world",
        targetLang: "de",
        description: "Auto-detect English and translate to German"
      },
      {
        text: "Wie geht es dir?",
        sourceLang: "de",
        targetLang: "en-GB",
        description: "German to British English"
      }
    ],
    configuration: {
      timeout: "5000ms",
      apiKeyPresent: !!process.env.DEEPL_API_KEY,
      apiKeyLength: process.env.DEEPL_API_KEY?.length || 0
    }
  });
};
export {
  GET,
  POST
};
