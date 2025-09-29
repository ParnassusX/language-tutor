// Test the complete voice processing pipeline
// This endpoint tests the integration between Deepgram, Deepl, and Gemini

import { env } from '$env/dynamic/private';

// Test function to check each service
async function testDeepgramConnection() {
  try {
    const response = await fetch('https://api.deepgram.com/v1/projects', {
      method: 'GET',
      headers: {
        'Authorization': `Token ${env.DEEPGRAM_API_KEY}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      return { status: 'success', message: 'Deepgram API connected', projects: data.projects?.length || 0 };
    } else {
      return { status: 'error', message: `Deepgram API error: ${response.status}` };
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error');
    return { status: 'error', message: `Deepgram connection failed: ${err.message}` };
  }
}

async function testDeeplConnection() {
  if (!env.DEEPL_API_KEY) {
    return { status: 'skipped', message: 'DEEPL_API_KEY not configured' };
  }

  try {
    const response = await fetch('https://api-free.deepl.com/v2/usage', {
      method: 'GET',
      headers: {
        'Authorization': `DeepL-Auth-Key ${env.DEEPL_API_KEY}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      const usage = ((data.character_count / data.character_limit) * 100).toFixed(1);
      return { status: 'success', message: `DeepL API connected (${usage}% used)` };
    } else {
      return { status: 'error', message: `DeepL API error: ${response.status}` };
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error');
    return { status: 'error', message: `DeepL connection failed: ${err.message}` };
  }
}

async function testGeminiConnection() {
  if (!env.GEMINI_API_KEY) {
    return { status: 'skipped', message: 'GEMINI_API_KEY not configured' };
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: 'Say "Hello from Gemini API" in one word.'
          }]
        }],
        generationConfig: {
          maxOutputTokens: 10
        }
      })
    });

    if (response.ok) {
      return { status: 'success', message: 'Gemini API connected' };
    } else {
      return { status: 'error', message: `Gemini API error: ${response.status}` };
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error');
    return { status: 'error', message: `Gemini connection failed: ${err.message}` };
  }
}

export const GET = async () => {
  try {
    const timestamp = new Date().toISOString();

    // Run all service tests in parallel
    const [deepgram, deepl, gemini] = await Promise.all([
      testDeepgramConnection(),
      testDeeplConnection(),
      testGeminiConnection()
    ]);

    const results = {
      timestamp,
      environment: env.NODE_ENV || 'unknown',
      services: {
        deepgram,
        deepl,
        gemini
      },
      summary: {
        total_services: 3,
        working_services: [deepgram, deepl, gemini].filter(s => s.status === 'success').length,
        skipped_services: [deepgram, deepl, gemini].filter(s => s.status === 'skipped').length,
        failed_services: [deepgram, deepl, gemini].filter(s => s.status === 'error').length
      }
    };

    // Determine overall status
    const overall_status = results.summary.failed_services > 0 ? 'partial_failure' :
                          results.summary.working_services === 3 ? 'all_good' : 'mixed';

    return new Response(JSON.stringify({
      status: overall_status,
      data: results
    }), {
      status: results.summary.failed_services > 0 ? 207 : 200, // 207 Multi-Status for partial failures
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    console.error('Pipeline test error:', error);
    return new Response(JSON.stringify({
      status: 'error',
      message: 'Failed to run pipeline tests',
      error: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
};

// Optional: POST for detailed pipeline testing with sample data
export const POST = async ({ request }: { request: Request }) => {
  try {
    const { text, target_lang = 'DE' } = await request.json();

    const results: {
      timestamp: string;
      input: { text: string; target_lang: string };
      steps: Array<{
        name: string;
        status: string;
        message?: string;
        translation?: string;
        reply?: string;
      }>;
    } = {
      timestamp: new Date().toISOString(),
      input: { text, target_lang },
      steps: []
    };

    // Step 1: Test Deepgram transcription simulation (we can't actually transcribe without audio)
    results.steps.push({
      name: 'speech_to_text',
      status: 'simulated',
      message: 'Deepgram STT would process audio input here'
    });

    // Step 2: Test DeepL translation if available
    if (env.DEEPL_API_KEY && text) {
      try {
        const translateResponse = await fetch('https://api-free.deepl.com/v2/translate', {
          method: 'POST',
          headers: {
            'Authorization': `DeepL-Auth-Key ${env.DEEPL_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: [text],
            target_lang
          })
        });

        if (translateResponse.ok) {
          const translateData = await translateResponse.json();
          results.steps.push({
            name: 'translation',
            status: 'success',
            translation: translateData.translations[0].text
          });
        } else {
          results.steps.push({
            name: 'translation',
            status: 'error',
            message: `DeepL translation failed: ${translateResponse.status}`
          });
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Unknown error');
        results.steps.push({
          name: 'translation',
          status: 'error',
          message: `Translation error: ${err.message}`
        });
      }
    } else {
      results.steps.push({
        name: 'translation',
        status: 'skipped',
        message: 'DeepL API key not configured'
      });
    }

    // Step 3: Test Gemini conversation simulation
    if (env.GEMINI_API_KEY && text) {
      try {
        const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${env.GEMINI_API_KEY}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `Respond to this German student message in German, keep it brief: "${text}"`
              }]
            }],
            generationConfig: {
              maxOutputTokens: 50
            }
          })
        });

        if (geminiResponse.ok) {
          const geminiData = await geminiResponse.json();
          const reply = geminiData.candidates[0]?.content?.parts[0]?.text || 'No response generated';
          results.steps.push({
            name: 'conversation_ai',
            status: 'success',
            reply: reply.replace(/\n/g, ' ').trim()
          });
        } else {
          results.steps.push({
            name: 'conversation_ai',
            status: 'error',
            message: `Gemini API error: ${geminiResponse.status}`
          });
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Unknown error');
        results.steps.push({
          name: 'conversation_ai',
          status: 'error',
          message: `Gemini error: ${err.message}`
        });
      }
    } else {
      results.steps.push({
        name: 'conversation_ai',
        status: 'skipped',
        message: 'Gemini API key not configured'
      });
    }

    // Step 4: Test voice synthesis simulation
    results.steps.push({
      name: 'text_to_speech',
      status: 'simulated',
      message: 'Deepgram TTS would generate speech here'
    });

    const overall_status = results.steps.every(step => step.status === 'success' || step.status === 'skipped')
      ? 'success' : 'partial_success';

    return new Response(JSON.stringify({
      status: overall_status,
      pipeline_test: results
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    console.error('Pipeline POST test error:', error);
    const err = error instanceof Error ? error : new Error('Unknown error');
    return new Response(JSON.stringify({
      status: 'error',
      message: 'Pipeline test failed',
      error: err.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
};
