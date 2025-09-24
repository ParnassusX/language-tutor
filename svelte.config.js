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
			precompress: true, // Enable compression for better performance
			envPrefix: '',
			// Ensure static files are properly handled
			preprocess: 'vercel'
		}),
		// Add this for Railway deployments
		csrf: {
			checkOrigin: process.env.NODE_ENV === 'production' // Only check origin in production
		},
		// Ensure correct paths in production
		paths: {
			assets: process.env.NODE_ENV === 'production' ? 'https://language-tutor-production-8569.up.railway.app' : '',
			base: ''
		}
	}
};

export default config;
