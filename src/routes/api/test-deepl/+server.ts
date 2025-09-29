// Test DeepL API integration
// Validates DeepL API key and basic functionality

import { env } from '$env/dynamic/private';

// Test DeepL API key validity
async function testDeeplKey() {
  if (!env.DEEPL_API_KEY) {
    return {
      status: 'error',
      message: 'DEEP_API_KEY not found in environment',
      details: 'Please ensure DEEPL_API_KEY is set in Railway environment variables'
    };
  }

  try {
    // Test 1: Get usage information
    const usageResponse = await fetch('https://api-free.deepl.com/v2/usage', {
      method: 'GET',
      headers: {
        'Authorization': `DeepL-Auth-Key ${env.DEEPL_API_KEY}`,
      },
    });

    if (!usageResponse.ok) {
      return {
        status: 'error',
        message: `DeepL API authentication failed: ${usageResponse.status}`,
        details: `HTTP ${usageResponse.status}: Please check your DEEPL_API_KEY`
      };
    }

    const usageData = await usageResponse.json();

    // Test 2: Quick translation test
    const testResponse = await fetch('https://api-free.deepl.com/v2/translate', {
      method: 'POST',
      headers: {
        'Authorization': `DeepL-Auth-Key ${env.DEEPL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: ['Hello, how are you?'],
        target_lang: 'DE'
      })
    });

    if (!testResponse.ok) {
      return {
        status: 'error',
        message: `DeepL translation test failed: ${testResponse.status}`,
        details: 'API key may be valid but may have quota issues or other restrictions'
      };
    }

    const testData = await testResponse.json();

    const usagePercent = ((usageData.character_count / usageData.character_limit) * 100).toFixed(1);

    return {
      status: 'success',
      message: 'DeepL API is fully functional',
      usage: {
        characters_used: usageData.character_count,
        character_limit: usageData.character_limit,
        usage_percent: `${usagePercent}%`,
        remaining: usageData.character_limit - usageData.character_count
      },
      test_translation: {
        input: 'Hello, how are you?',
        output: testData.translations[0].text,
        detected_language: testData.translations[0].detected_source_language?.toUpperCase()
      },
      quota_reset: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)).toISOString() // ~30 days from now
    };

  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error');
    return {
      status: 'error',
      message: 'DeepL API connection failed',
      details: err.message
    };
  }
}

// Test specific translation functionality
async function testTranslation(text: string, targetLang: string = 'DE') {
  if (!env.DEEPL_API_KEY) {
    return {
      status: 'error',
      message: 'DeepL API key not configured'
    };
  }

  try {
    const response = await fetch('https://api-free.deepl.com/v2/translate', {
      method: 'POST',
      headers: {
        'Authorization': `DeepL-Auth-Key ${env.DEEPL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: [text],
        target_lang: targetLang,
        source_lang: 'AUTO' // Auto-detect source language
      })
    });

    if (!response.ok) {
      return {
        status: 'error',
        message: `Translation failed: ${response.status}`,
        details: await response.text()
      };
    }

    const data = await response.json();
    const translation = data.translations[0];

    return {
      status: 'success',
      input: text,
      output: translation.text,
      detected_source_lang: translation.detected_source_language?.toUpperCase(),
      target_lang: targetLang,
      confidence: 'deterministic' // DeepL provides high-quality deterministic translations
    };

  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error');
    return {
      status: 'error',
      message: 'Translation request failed',
      details: err.message
    };
  }
}

export const GET = async () => {
  try {
    const timestamp = new Date().toISOString();
    const keyTest = await testDeeplKey();

    // Get supported languages for reference
    let supportedLanguages = null;
    if (keyTest.status === 'success') {
      try {
        const langResponse = await fetch('https://api-free.deepl.com/v2/languages', {
          method: 'GET',
          headers: {
            'Authorization': `DeepL-Auth-Key ${env.DEEPL_API_KEY}`,
          },
        });

        if (langResponse.ok) {
          const languages = await langResponse.json();
          supportedLanguages = languages;
        }
      } catch (langError) {
        console.warn('Could not fetch supported languages:', langError);
      }
    }

    return new Response(JSON.stringify({
      timestamp,
      test_type: 'deepl_api_validation',
      api_status: keyTest,
      supported_languages: supportedLanguages,
      api_type: 'free',
      documentation: 'https://www.deepl.com/docs-api'
    }), {
      status: keyTest.status === 'success' ? 200 : 500,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error');
    console.error('DeepL test error:', err);
    return new Response(JSON.stringify({
      timestamp: new Date().toISOString(),
      test_type: 'deepl_api_validation',
      error: 'Test execution failed',
      details: err.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
};

// POST endpoint for testing specific translations
export const POST = async ({ request }: { request: Request }) => {
  try {
    const { text, target_lang = 'DE' } = await request.json();

    if (!text) {
      return new Response(JSON.stringify({
        status: 'error',
        message: 'Missing required parameter: text'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    const result = await testTranslation(text, target_lang.toUpperCase());

    return new Response(JSON.stringify({
      timestamp: new Date().toISOString(),
      test_type: 'deepl_translation_test',
      translation: result
    }), {
      status: result.status === 'success' ? 200 : 500,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error');
    console.error('DeepL translation test error:', err);
    return new Response(JSON.stringify({
      timestamp: new Date().toISOString(),
      test_type: 'deepl_translation_test',
      error: 'Translation test failed',
      details: err.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
};
