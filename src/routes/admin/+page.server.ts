import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { env } from '$env/dynamic/private';
import { dev } from '$app/environment';

export const load: PageServerLoad = ({ cookies }) => {
	const sessionCookie = cookies.get('session');
	const session = sessionCookie ? JSON.parse(sessionCookie) : { loggedIn: false };

	if (!session.loggedIn) {
		return {
			session: { loggedIn: false },
			apiKeys: null
		};
	}

	const maskKey = (key?: string): string => {
		if (!key || key.includes('_HERE')) return 'Not set';
		return `...${key.slice(-4)}`;
	};

	// Access environment variables at runtime
	const DEEPGRAM_API_KEY = env.DEEPGRAM_API_KEY;
	const DEEPL_API_KEY = env.DEEPL_API_KEY;
	const GEMINI_API_KEY = env.GEMINI_API_KEY;

	return {
		session,
		apiKeys: {
			deepgram: maskKey(DEEPGRAM_API_KEY),
			deepl: maskKey(DEEPL_API_KEY),
			gemini: maskKey(GEMINI_API_KEY)
		}
	};
};

export const actions: Actions = {
	login: async ({ cookies, request }) => {
		const data = await request.formData();
		const password = data.get('password');

		const ADMIN_PASSWORD = env.ADMIN_PASSWORD;
		if (password !== ADMIN_PASSWORD) {
			return fail(401, { error: 'Invalid password.' });
		}

		const session = { loggedIn: true };
		cookies.set('session', JSON.stringify(session), {
			path: '/',
			httpOnly: true,
			sameSite: 'strict',
			maxAge: 60 * 60 * 24 * 7 // 1 week
		});

		throw redirect(303, '/admin');
	},
	logout: async ({ cookies }) => {
		cookies.delete('session', { path: '/' });
		throw redirect(303, '/admin');
	},
	updateKeys: async ({ request, cookies }) => {
		const sessionCookie = cookies.get('session');
		const session = sessionCookie ? JSON.parse(sessionCookie) : { loggedIn: false };

		if (!session.loggedIn) {
			return fail(401, { error: 'Unauthorized' });
		}

		const data = await request.formData();
		const keysToUpdate = [
			{ name: 'DEEPGRAM_API_KEY', value: data.get('deepgram_api_key') as string },
			{ name: 'DEEPL_API_KEY', value: data.get('deepl_api_key') as string },
			{ name: 'GEMINI_API_KEY', value: data.get('gemini_api_key') as string }
		].filter((key) => key.value);

		if (keysToUpdate.length === 0) {
			return fail(400, { error: 'No keys to update.' });
		}

		// Railway deployment - cannot dynamically update environment variables
		// Must be done manually in Railway dashboard
		return {
			message: `Railway Deployment: Environment variables cannot be updated dynamically. Please update the following keys in your Railway project dashboard (Variables tab):

${keysToUpdate.map(k => `• ${k.name}`).join('\n')}

After updating, redeploy your application for changes to take effect.`
		};
	}
};
