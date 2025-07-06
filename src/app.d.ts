// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
		interface PrivateEnv {
			ADMIN_PASSWORD?: string;
			DEEPGRAM_API_KEY?: string;
			DEEPL_API_KEY?: string;
			GROQ_API_KEY?: string;
			VERCEL_TOKEN?: string;
			VERCEL_PROJECT_ID?: string;
			VERCEL_TEAM_ID?: string;
			KV_URL?: string;
			KV_REST_API_URL?: string;
			KV_REST_API_TOKEN?: string;
			KV_REST_API_READ_ONLY_TOKEN?: string;
			GEMINI_API_KEY?: string;
		}
	}
}

export {};
