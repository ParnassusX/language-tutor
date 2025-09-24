import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		// Using Node adapter for Railway deployment
		// https://kit.svelte.dev/docs/adapter-node
		adapter: adapter({
			// Railway deployment settings
			out: 'build',
			precompress: false,
			envPrefix: ''
		}),
		// Add this for Railway deployments
		csrf: {
			checkOrigin: false
		}
	}
};

export default config;
