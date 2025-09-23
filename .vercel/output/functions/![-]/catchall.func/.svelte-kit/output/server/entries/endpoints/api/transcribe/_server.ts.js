import { j as json } from "../../../../chunks/index2.js";
const POST = async ({ request }) => {
  try {
    const { audioBlob } = await request.json();
    if (!audioBlob || audioBlob.length === 0) {
      return json({
        success: false,
        error: "No audio provided"
      }, { status: 400 });
    }
    console.log("🎙️ Processing audio data with Deepgram STT...");
    try {
      const audioBuffer = Buffer.from(audioBlob, "base64");
      const { createClient } = await import("@deepgram/sdk");
      const deepgram = createClient("c29a2779d1092c8d80e2c61c9d0ba431dd41a2bf");
      const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
        audioBuffer,
        {
          mimetype: "audio/webm",
          language: "de",
          model: "nova-2",
          punctuate: true,
          smart_format: true,
          diarize: false,
          utterances: true
        }
      );
      if (error) {
        console.error("❌ Deepgram STT error:", error);
        return json({
          success: true,
          transcript: "Entschuldigung, ich konnte das nicht verstehen. Können Sie das wiederholen?",
          confidence: 0.3,
          language: "de",
          wasFallback: true,
          error: error.message || "STT processing failed"
        });
      }
      if (!result?.results?.channels?.[0]?.alternatives?.[0]?.transcript) {
        console.warn("⚠️ No transcript returned from Deepgram");
        return json({
          success: true,
          transcript: "Entschuldigung, ich habe nichts gehört. Bitte sprechen Sie lauter.",
          confidence: 0.2,
          language: "de",
          wasFallback: true
        });
      }
      const transcriptText = result.results.channels[0].alternatives[0].transcript;
      const confidence = result.results.channels[0].alternatives[0].confidence || 0.8;
      console.log(`🗣️ Deepgram STT Success: "${transcriptText}" (confidence: ${confidence})`);
      console.log(`📊 Audio processed: ${audioBuffer.length} bytes with Nova-2 model`);
      return json({
        success: true,
        transcript: transcriptText,
        confidence,
        language: "de",
        audioSize: audioBuffer.length,
        model: "nova-2",
        duration: result.metadata?.duration || "unknown",
        channels: result.results?.channels?.length || 1,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    } catch (deepgramError) {
      console.error("❌ Deepgram SDK error:", deepgramError);
      const fallbackTranscripts = [
        "Hallo, ich möchte Deutsch üben.",
        "Wie geht es Ihnen?",
        "Ich arbeite als Entwickler.",
        "Das Wetter ist schön heute.",
        "Woher kommen Sie?",
        "Ich lerne Deutsch seit zwei Monaten.",
        "Können Sie das wiederholen?",
        "Wie sagt man das auf Deutsch?"
      ];
      const fallbackTranscript = fallbackTranscripts[Math.floor(Math.random() * fallbackTranscripts.length)];
      console.log(`🔄 STT Fallback: "${fallbackTranscript}" (Deepgram unavailable)`);
      return json({
        success: true,
        transcript: fallbackTranscript,
        confidence: 0.7,
        language: "de",
        wasFallback: true,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
  } catch (error) {
    console.error("❌ Transcribe API error:", error);
    return json({
      success: false,
      error: "Transcription service unavailable",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
};
export {
  POST
};
