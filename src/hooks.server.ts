import type { Handle } from '@sveltejs/kit';
import { verifySession } from '$lib/server/auth';

// Validate environment variables before app starts
function validateEnvironment() {
	const requiredEnvVars = {
		DEEPGRAM_API_KEY: process.env.DEEPGRAM_API_KEY
	};

	const missingVars: string[] = [];

	Object.entries(requiredEnvVars).forEach(([key, value]) => {
		if (!value) {
			missingVars.push(key);
		}
	});

	if (missingVars.length > 0) {
		console.error(`❌ Missing required environment variables: ${missingVars.join(', ')}`);
		console.error('🔧 Set these in Railway Dashboard > Variables section');
		console.error('📖 Get DEEPGRAM_API_KEY from https://console.deepgram.com/');
		process.exit(1);
	}

	console.log('✅ All required environment variables are set');
}

validateEnvironment();

export const handle: Handle = async ({ event, resolve }) => {
  const session = event.cookies.get('session');
  if (session) {
    const user = await verifySession(session);
    if (user) {
      event.locals.user = user;
    }
  }

  if (event.url.pathname !== '/login' && event.url.pathname !== '/signup' && !event.locals.user) {
    return new Response(null, {
      status: 302,
      headers: {
        location: '/login',
      },
    });
  }

	const response = await resolve(event);

	// Add security headers for production
	if (import.meta.env.PROD) {
		response.headers.set('X-Content-Type-Options', 'nosniff');
		response.headers.set('X-Frame-Options', 'SAMEORIGIN');
		response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
	}

	return response;
};
