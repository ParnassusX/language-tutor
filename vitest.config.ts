// Minimal Vitest configuration for SvelteKit
// @ts-nocheck
import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'path';

// Create a simple configuration that avoids type errors
export default defineConfig({
  // Basic configuration
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{js,ts}'],
    
    // Mock SvelteKit runtime modules
    alias: [
      {
        find: /^\$app\//,
        replacement: '/src/app-mock/'
      }
    ]
  },
  
  // Resolve aliases
  resolve: {
    alias: {
      '$app/environment': path.resolve('./src/app-mock/environment.ts'),
      $lib: path.resolve('./src/lib')
    }
  },
  
  // Minimal plugins configuration
  plugins: [
    // @ts-ignore - Ignore type errors
    svelte()
  ]
});
