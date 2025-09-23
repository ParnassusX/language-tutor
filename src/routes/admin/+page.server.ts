import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	DEEPGRAM_API_KEY,
	DEEPL_API_KEY,
	GEMINI_API_KEY,
	VERCEL_TOKEN,
	VERCEL_PROJECT_ID,
	VERCEL_TEAM_ID,
	ADMIN_PASSWORD
} from '$env/static/private';
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

	const maskKey = (key: string) => {
		if (!key || key.includes('_HERE')) return 'Not set';
		return `...${key.slice(-4)}`;
	};

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

		if (dev) {
			return {
				message: `Received keys to update (local only): ${keysToUpdate
					.map((k) => k.name)
					.join(', ')}. Please update your .env file and restart the server.`
			};
		}

		try {
			for (const key of keysToUpdate) {
				const response = await fetch(
					`https://api.vercel.com/v10/projects/${VERCEL_PROJECT_ID}/env?teamId=${VERCEL_TEAM_ID}`,
					{
						method: 'POST',
						headers: {
							Authorization: `Bearer ${VERCEL_TOKEN}`,
							'Content-Type': 'application/json'
						},
						body: JSON.stringify({
							key: key.name,
							value: key.value,
							type: 'encrypted',
							target: ['production', 'preview', 'development']
						})
					}
				);

				if (!response.ok) {
					const errorData = await response.json();
					return fail(response.status, {
						error: `Failed to update ${key.name}: ${errorData.error.message}`
					});
				}
			}
			return { message: 'API keys updated successfully. Changes may take a moment to apply.' };
		} catch (error) {
			return fail(500, { error: 'An unexpected error occurred.' });
		}
	}
};
