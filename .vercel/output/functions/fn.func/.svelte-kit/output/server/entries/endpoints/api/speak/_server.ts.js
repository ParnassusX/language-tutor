import { createClient } from "@deepgram/sdk";
import { D as DEEPGRAM_API_KEY } from "../../../../chunks/private.js";
const deepgram = createClient(DEEPGRAM_API_KEY);
const POST = async ({ request }) => {
  const { text } = await request.json();
  if (!text) {
    return new Response("Missing text in request body", { status: 400 });
  }
  try {
    const response = await deepgram.speak.request(
      { text },
      {
        model: "aura-asteria-en"
        // A high-quality, conversational English voice
      }
    );
    const stream = await response.getStream();
    if (!stream) {
      throw new Error("Failed to get audio stream.");
    }
    return new Response(stream, {
      headers: {
        "Content-Type": "audio/mpeg"
      }
    });
  } catch (err) {
    const error = err;
    console.error("Error generating audio:", error.message);
    return new Response("Failed to generate audio.", { status: 500 });
  }
};
export {
  POST
};
