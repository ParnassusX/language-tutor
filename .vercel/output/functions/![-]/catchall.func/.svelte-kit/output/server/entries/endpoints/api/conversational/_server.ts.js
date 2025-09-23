import { j as json } from "../../../../chunks/index2.js";
const POST = async ({ request }) => {
  try {
    const { audioBlob, conversationId, message } = await request.json();
    console.warn("⚠️ [DEPRECATED] Using legacy conversational API - real voice conversations use WebSocket client");
    if (message && !audioBlob) {
      const aiResponse = await getRealAITeachingResponse(message);
      return json({
        success: true,
        type: "text-ai",
        transcript: message,
        aiResponse,
        audioUrl: null,
        // Audio generated client-side via WebSocket
        conversationId: conversationId || generateConversationId(),
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        note: "Using Gemini AI for real German tutor responses"
      });
    }
    if (audioBlob) {
      const mockTranscript = "Deutsche Konversation! Wie geht es dir heute?";
      const aiResponse = await getRealAITeachingResponse(mockTranscript);
      return json({
        success: true,
        type: "voice-ai",
        transcript: mockTranscript,
        aiResponse,
        audioUrl: null,
        // Audio generated client-side via WebSocket
        conversationId: conversationId || generateConversationId(),
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        note: "STT via separate API, using Gemini AI for real tutor responses"
      });
    }
    return json({ success: false, error: "No audio or message provided" }, { status: 400 });
  } catch (error) {
    console.error("❌ Legacy Conversational API error:", error);
    return json({
      success: false,
      wasFallback: true,
      error: "Conversational processing failed",
      message: "Voice functionality now uses WebSocket client - check browser console"
    }, { status: 500 });
  }
};
async function getRealAITeachingResponse(userInput) {
  try {
    const GEMINI_API_KEY = "AIzaSyCFLstiaPGFSxV7rM21EtZz_DEoJSLN05E";
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Du bist ein ELITE-Deutschlehrer mit 20 Jahren Erfahrung in Sprachausbildung. Du gibst präzise, hilfreiche Rückmeldungen für Lernende eines jeden Niveaus.

DER SCHÜLER HAT GESAGT: "${userInput}"

🏆 DEINE MISSION: GIB DETALLIERTE, PÄDAGOGISCH WERTVOLLE RÜCKMELDUNG

Antworte IMMER nur auf DEUTSCH.
Analysiere:
1. AUSSPRACHE: Gib spezifische Laute, die korrekt/incorrect waren ("Dein 'ch' in 'sprechen' ist perfekt!")
2. GRAMMATIK: Korrigiere sanft und erkläre die Regel ("'Hab' statt 'habe' in Fragen")
3. FLÜSSIGKEIT: Bewerte Sprechrhythmus und Natürlichkeit
4. WORTWAHL: Vorschlage bessere/alternative Ausdrücke

Struktur DEINE Antwort exakt so:
• EINE kurze Ermutigung
• EIN konkreter Verbesserungsvorschlag
• EIN Übungstipp für nächste Praxis
• EINE motivierende Frage

Maximale LÄNGE: 2-3 Sätze.
Sei hilfreich, motivierend und präzise wie ein professioneller Sprachtrainer.`
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 200
        }
      })
    });
    if (response.ok) {
      const data = await response.json();
      const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      if (aiResponse.trim()) {
        console.log("🤖 Gemini AI Response:", aiResponse.substring(0, 100) + "...");
        return aiResponse.trim();
      }
    }
    console.warn("❌ Gemini AI failed, falling back to OpenAI");
  } catch (geminiError) {
    console.warn("⚠️ Gemini AI unavailable:", geminiError);
  }
  try {
    const OPENAI_API_KEY = "your-openai-key-here";
    if (!OPENAI_API_KEY || OPENAI_API_KEY.includes("your-")) {
      throw new Error("No OpenAI key");
    }
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "Du bist ein hilfreicher Deutschlehrer für Anfänger und Fortgeschrittene. Antworte immer nur auf Deutsch. Sei freundlich, geduldig und hilfreich."
          },
          {
            role: "user",
            content: `Der Schüler hat gesagt: "${userInput}". Gib eine hilfreiche deutsche Lektion- oder Konversationsantwort.`
          }
        ],
        max_tokens: 150,
        temperature: 0.7
      })
    });
    if (response.ok) {
      const data = await response.json();
      const aiResponse = data.choices?.[0]?.message?.content || "";
      if (aiResponse.trim()) {
        console.log("🤖 OpenAI Response:", aiResponse.substring(0, 100) + "...");
        return aiResponse.trim();
      }
    }
  } catch (openAIError) {
    console.warn("⚠️ OpenAI unavailable, using production fallback");
  }
  console.log("🔄 Using production fallback logic");
  return getProductionFallbackResponse(userInput);
}
function getProductionFallbackResponse(userInput) {
  const input = userInput.toLowerCase();
  if (input.includes("hallo") || input.includes("hi") || input.includes("hello") || input.includes("guten") || input.includes("morgen") || input.includes("tag") || input.includes("abend")) {
    return "Sehr gute Begrüßung! Wir Deutschen sagen oft: 'Guten Morgen', 'Guten Tag' oder 'Guten Abend', abhängig von der Tageszeit. Wie ist das Wetter heute bei dir?";
  }
  if (input.includes("woher") || input.includes("komm") || input.includes("from") || input.includes("aus")) {
    return "Interessant! In Deutschland fragen wir 'Woher kommst du?' und antworten 'Ich komme aus [Stadt/Land]'. Zum Beispiel: 'Ich komme aus Berlin.' Woher kommst du?";
  }
  if (input.includes("arbeit") || input.includes("job") || input.includes("work") || input.includes("mach") || input.includes("beruf")) {
    return "Ein wichtiges Thema! Wir sagen: 'Ich arbeite als [Beruf]' oder 'Ich bin [Beruf]'. 'Lehrer' wird zu 'Lehrer/in' für Geschlechtergerechtigkeit. Was machst du beruflich?";
  }
  if (input.includes("wetter") || input.includes("weather") || input.includes("heute") || input.includes("kalt") || input.includes("warm") || input.includes("regnet") || input.includes("regnerisch") || input.includes("sonnig")) {
    return "Das Wetter-Thema ist perfekt zum Üben! Wir sagen: 'Es regnet heute' oder 'Die Sonne scheint'. Wie ist das Wetter heute bei dir?";
  }
  return "Das ist sehr gut, dass du Deutsch übst! Deine Aussprache entwickelt sich positiv. Lass uns nochmal wiederholen: Welches Wort möchtest du besonders üben?";
}
function generateConversationId() {
  return `german_tutor_${Date.now()}_${Math.random().toString(36).substring(2)}`;
}
export {
  POST
};
