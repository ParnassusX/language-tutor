import { j as json } from "../../../../chunks/index2.js";
import { a as withGeminiTimeout, T as TimeoutError } from "../../../../chunks/timeout.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const POST = async ({ request }) => {
  const startTime = Date.now();
  try {
    const { prompt, systemPrompt, model } = await request.json();
    console.log(`[test-gemini] Starting AI generation test...`);
    console.log(`[test-gemini] Model: ${model || "gemini-pro"}`);
    console.log(`[test-gemini] Prompt: "${prompt}"`);
    console.log(`[test-gemini] System Prompt: "${systemPrompt || "None"}"`);
    console.log(`[test-gemini] API Key present: ${process.env.GEMINI_API_KEY ? "Yes (" + process.env.GEMINI_API_KEY.length + " chars)" : "No"}`);
    if (!prompt || typeof prompt !== "string") {
      return json({
        success: false,
        error: "Prompt is required and must be a string"
      }, { status: 400 });
    }
    const modelName = model || "gemini-pro";
    const geminiModel = genAI.getGenerativeModel({ model: modelName });
    let fullPrompt = prompt;
    if (systemPrompt) {
      fullPrompt = `${systemPrompt}

User: ${prompt}`;
    }
    console.log(`[test-gemini] Calling Gemini API with model ${modelName}...`);
    const generationPromise = geminiModel.generateContent(fullPrompt);
    const result = await withGeminiTimeout(generationPromise);
    const endTime = Date.now();
    const duration = endTime - startTime;
    console.log(`[test-gemini] ✅ AI generation completed in ${duration}ms`);
    const response = await result.response;
    const text = response.text();
    console.log(`[test-gemini] Response length: ${text.length} characters`);
    console.log(`[test-gemini] Response preview: "${text.substring(0, 100)}..."`);
    return json({
      success: true,
      generation: {
        text,
        model: modelName,
        promptTokens: fullPrompt.length,
        // Approximate
        responseTokens: text.length
        // Approximate
      },
      performance: {
        duration,
        timeoutLimit: 3e4
      },
      metadata: {
        originalPrompt: prompt,
        systemPrompt: systemPrompt || null,
        fullPrompt
      }
    });
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    console.error(`[test-gemini] ❌ Error after ${duration}ms:`, error);
    if (error instanceof TimeoutError) {
      console.error(`[test-gemini] 🕐 Gemini AI timed out after ${error.timeoutMs}ms`);
      return json({
        success: false,
        error: "timeout",
        message: `Gemini AI generation timed out after ${error.timeoutMs}ms`,
        performance: {
          duration,
          timeoutLimit: error.timeoutMs
        }
      }, { status: 408 });
    }
    if (error && typeof error === "object" && "message" in error) {
      console.error(`[test-gemini] 🤖 Gemini API Error:`, error.message);
      return json({
        success: false,
        error: "gemini_api_error",
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
    message: "Google Gemini AI test endpoint",
    usage: "POST with { prompt: string, systemPrompt?: string, model?: string }",
    examples: [
      {
        prompt: "Hello, how are you?",
        description: "Simple greeting test"
      },
      {
        prompt: "Explain quantum physics in simple terms",
        systemPrompt: "You are a helpful physics teacher.",
        description: "Educational response with system prompt"
      },
      {
        prompt: "What is the weather like today?",
        model: "gemini-pro",
        description: "Specific model test"
      }
    ],
    configuration: {
      timeout: "30000ms",
      defaultModel: "gemini-pro",
      apiKeyPresent: !!process.env.GEMINI_API_KEY,
      apiKeyLength: process.env.GEMINI_API_KEY?.length || 0
    }
  });
};
export {
  GET,
  POST
};
