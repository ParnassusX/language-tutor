import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),

	kit: {
		adapter: adapter({
			// Output directory for the production build
			out: 'build',
			// Polyfill Node.js globals for browser compatibility
			polyfill: true
		})
	}
};

export default config;
