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
			// Railway deployment settings - simplified for Railway
			out: 'build',
			precompress: false, // Disable precompress for Railway
			envPrefix: ''
		}),
		// CSRF protection for Railway
		csrf: {
			checkOrigin: false // Disabled for Railway proxy handling
		},
		// Let Railway handle paths dynamically - no hardcoded paths
		paths: {
			assets: '',
			base: ''
		},
		// Ensure client-side assets are served correctly
		serviceWorker: {
			register: false
		}
	}
};

export default config;
