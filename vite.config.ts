import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { configureWebSocketServer } from './src/hooks/webSocketServer';

export default defineConfig({
	plugins: [
		sveltekit(),
		{
			name: 'webSocketServer',
			configureServer(server) {
				if (server.httpServer) {
					configureWebSocketServer(server.httpServer);
				}
			}
		}
	],
	define: {
		global: 'globalThis'
	},
	// Explicitly configure build options to handle problematic CJS dependencies
	build: {
		commonjsOptions: {
			transformMixedEsModules: true,
		}
	}
});
