import { j as json } from "../../../../chunks/index2.js";
import * as dotenv from "dotenv";
dotenv.config();
const POST = async ({ request }) => {
  try {
    const { text } = await request.json();
    if (!text) {
      return json({ error: "No text provided" }, { status: 400 });
    }
    console.log(`🔊 TTS Request: "${text.substring(0, 50)}..."`);
    const voiceResponses = [
      "audio/dummy-response-1.wav",
      "audio/dummy-response-2.wav",
      "audio/dummy-response-3.wav"
    ];
    const audioDuration = Math.max(text.length * 50, 2e3);
    const audioSize = Math.floor(audioDuration * 32);
    const mockAudioUrl = `data:audio/wav;base64,${Buffer.from(`${text}+${Date.now()}`).toString("base64")}`;
    console.log(`✅ TTS Generated: ${audioSize} bytes (${audioDuration}ms)`);
    console.log(`🔊 Audio URL: ${mockAudioUrl.substring(0, 50)}...`);
    return json({
      success: true,
      audioUrl: mockAudioUrl,
      audioSize,
      duration: audioDuration,
      text,
      language: "de",
      voice: "aura-stella-en"
    });
  } catch (error) {
    console.error("❌ TTS processing error:", error);
    return json({
      success: false,
      error: "Speech generation failed",
      message: "Unable to generate audio"
    }, { status: 500 });
  }
};
export {
  POST
};
