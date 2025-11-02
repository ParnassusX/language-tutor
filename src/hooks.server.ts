import type { Handle } from '@sveltejs/kit';
import { verifySession } from '$lib/server/auth';
import 'dotenv/config';

export const handle: Handle = async ({ event, resolve }) => {
  const session = event.cookies.get('session');
  if (session) {
    const user = await verifySession(session);
    if (user) {
      event.locals.user = user;
    }
  }

  if (event.url.pathname.startsWith('/tutor') && !event.locals.user) {
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
