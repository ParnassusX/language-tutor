import { j as json } from "../../../../chunks/index2.js";
import { p as promiseWithTimeout, b as TIMEOUT_CONFIG, T as TimeoutError } from "../../../../chunks/timeout.js";
const POST = async ({ request }) => {
  try {
    const { testType, delay } = await request.json();
    console.log(`[test-timeout] Testing timeout utility - Type: ${testType}, Delay: ${delay}ms`);
    switch (testType) {
      case "success":
        const successPromise = new Promise((resolve) => {
          setTimeout(() => resolve("Success!"), delay || 1e3);
        });
        const successResult = await promiseWithTimeout(
          successPromise,
          3e3,
          // 3 second timeout
          new TimeoutError("Test timeout", 3e3)
        );
        return json({
          success: true,
          result: successResult,
          message: "Promise completed successfully before timeout"
        });
      case "timeout":
        const slowPromise = new Promise((resolve) => {
          setTimeout(() => resolve("Too slow!"), delay || 5e3);
        });
        try {
          await promiseWithTimeout(
            slowPromise,
            2e3,
            // 2 second timeout
            new TimeoutError("Test timeout occurred", 2e3)
          );
          return json({
            success: false,
            error: "Promise should have timed out but did not"
          });
        } catch (error) {
          if (error instanceof TimeoutError) {
            return json({
              success: true,
              result: "timeout_caught",
              message: `Timeout correctly caught: ${error.message}`,
              timeoutMs: error.timeoutMs
            });
          }
          throw error;
        }
      case "deepl_simulation":
        const deeplSimulation = new Promise((resolve) => {
          setTimeout(() => resolve("Translated text"), delay || 2e3);
        });
        const deeplResult = await promiseWithTimeout(
          deeplSimulation,
          TIMEOUT_CONFIG.DEEPL_TRANSLATION,
          new TimeoutError("DeepL simulation timeout", TIMEOUT_CONFIG.DEEPL_TRANSLATION)
        );
        return json({
          success: true,
          result: deeplResult,
          message: `DeepL simulation completed in ${delay}ms (timeout: ${TIMEOUT_CONFIG.DEEPL_TRANSLATION}ms)`
        });
      case "gemini_simulation":
        const geminiSimulation = new Promise((resolve) => {
          setTimeout(() => resolve("AI generated response"), delay || 1e4);
        });
        const geminiResult = await promiseWithTimeout(
          geminiSimulation,
          TIMEOUT_CONFIG.GEMINI_AI,
          new TimeoutError("Gemini simulation timeout", TIMEOUT_CONFIG.GEMINI_AI)
        );
        return json({
          success: true,
          result: geminiResult,
          message: `Gemini simulation completed in ${delay}ms (timeout: ${TIMEOUT_CONFIG.GEMINI_AI}ms)`
        });
      default:
        return json({
          success: false,
          error: "Invalid test type. Use: success, timeout, deepl_simulation, or gemini_simulation"
        }, { status: 400 });
    }
  } catch (error) {
    console.error("[test-timeout] Error:", error);
    if (error instanceof TimeoutError) {
      return json({
        success: false,
        error: "timeout",
        message: error.message,
        timeoutMs: error.timeoutMs
      }, { status: 408 });
    }
    return json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    }, { status: 500 });
  }
};
const GET = async () => {
  return json({
    message: "Timeout utility test endpoint",
    usage: 'POST with { testType: "success|timeout|deepl_simulation|gemini_simulation", delay?: number }',
    examples: [
      { testType: "success", delay: 1e3, description: "Promise completes in 1s (before 3s timeout)" },
      { testType: "timeout", delay: 5e3, description: "Promise takes 5s but times out at 2s" },
      { testType: "deepl_simulation", delay: 2e3, description: "Simulate DeepL API call" },
      { testType: "gemini_simulation", delay: 1e4, description: "Simulate Gemini AI call" }
    ]
  });
};
export {
  GET,
  POST
};
