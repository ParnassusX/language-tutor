import { j as json } from "../../../../chunks/index2.js";
const GET = async () => {
  console.log("🔍 DEBUG: Environment check requested");
  try {
    const debug = {
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      environment: {
        DEEPGRAM_API_KEY: process.env.DEEPGRAM_API_KEY ? "Present" : "Missing",
        DEEPL_API_KEY: process.env.DEEPL_API_KEY ? "Present" : "Missing",
        GEMINI_API_KEY: process.env.GEMINI_API_KEY ? "Present" : "Missing",
        NODE_ENV: process.env.NODE_ENV || "undefined"
      },
      apiKeyLengths: {
        DEEPGRAM_API_KEY: process.env.DEEPGRAM_API_KEY?.length || 0,
        DEEPL_API_KEY: process.env.DEEPL_API_KEY?.length || 0,
        GEMINI_API_KEY: process.env.GEMINI_API_KEY?.length || 0
      },
      imports: {
        deepgram: "checking...",
        deepl: "checking...",
        gemini: "checking..."
      }
    };
    try {
      const { createClient } = await import("@deepgram/sdk");
      debug.imports.deepgram = "OK";
    } catch (error) {
      debug.imports.deepgram = `Error: ${error instanceof Error ? error.message : "Unknown"}`;
    }
    try {
      const deepl = await import("deepl-node");
      debug.imports.deepl = "OK";
    } catch (error) {
      debug.imports.deepl = `Error: ${error instanceof Error ? error.message : "Unknown"}`;
    }
    try {
      const { GoogleGenerativeAI } = await import("@google/generative-ai");
      debug.imports.gemini = "OK";
    } catch (error) {
      debug.imports.gemini = `Error: ${error instanceof Error ? error.message : "Unknown"}`;
    }
    console.log("🔍 DEBUG: Environment check completed", debug);
    return json({
      status: "success",
      debug
    });
  } catch (error) {
    console.error("🔍 DEBUG: Environment check failed", error);
    return json({
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : void 0
    }, { status: 500 });
  }
};
export {
  GET
};
