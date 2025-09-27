import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

// Diagnostic endpoint to check API keys and environment
export const GET = async () => {
    try {
        // Mask API keys for security (show first and last few characters)
        const maskKey = (key: string) => {
            if (!key || key.length < 8) return 'Invalid/Too short';
            return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
        };

        // Access environment variables at runtime
        const DEEPGRAM_API_KEY = env.DEEPGRAM_API_KEY;
        const DEEPL_API_KEY = env.DEEPL_API_KEY;
        const GEMINI_API_KEY = env.GEMINI_API_KEY;
        const ADMIN_PASSWORD = env.ADMIN_PASSWORD;

        // Test basic API connectivity (not actual calls)
        const results = {
            server_info: {
                platform: process.env.RAILWAY_ENVIRONMENT_NAME ? 'Railway' : 'Local',
                environment: process.env.NODE_ENV || 'unknown',
                timestamp: new Date().toISOString()
            },
            api_keys: {
                deepgram: {
                    exists: !!DEEPGRAM_API_KEY,
                    format: DEEPGRAM_API_KEY ? maskKey(DEEPGRAM_API_KEY) : 'Missing',
                    valid_format: DEEPGRAM_API_KEY && DEEPGRAM_API_KEY.length > 20 ? 'Likely valid' : 'May be invalid'
                },
                deepl: {
                    exists: !!DEEPL_API_KEY,
                    format: DEEPL_API_KEY ? maskKey(DEEPL_API_KEY) : 'Missing',
                    valid_format: DEEPL_API_KEY && DEEPL_API_KEY.includes(':') ? 'Probably valid' : 'May be invalid'
                },
                gemini: {
                    exists: !!GEMINI_API_KEY,
                    format: GEMINI_API_KEY ? maskKey(GEMINI_API_KEY) : 'Missing',
                    valid_format: GEMINI_API_KEY && GEMINI_API_KEY.startsWith('AIzaSy') ? 'Probably valid' : 'May be invalid'
                },
                admin_password: {
                    exists: !!ADMIN_PASSWORD,
                    format: ADMIN_PASSWORD ? maskKey(ADMIN_PASSWORD) : 'Missing'
                }
            },
            troubleshooting: {
                next_steps: [
                    'If any keys show "Missing", they are not set in environment variables',
                    'If keys show wrong format, they may be placeholder values',
                    'Copy exact working keys from your .env file to Railway',
                    'Railway redeploys automatically after changing environment variables'
                ],
                railway_specific: [
                    'Railway environment variables must be exact copies from working .env',
                    'Railway uses different Node.js runtime than local development',
                    'Railway has network restrictions that may affect API calls'
                ]
            }
        };

        return json(results, { status: 200 });
    } catch (error) {
        console.error('Diagnostics error:', error);
        return json({
            error: 'Failed to generate diagnostics',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
};
