// @ts-nocheck
import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';
import path from 'path';

export default defineConfig({
  plugins: [sveltekit()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{js,ts}'],
    exclude: ['src/**/*.svelte']
  },
  resolve: {
    alias: {
      '$lib': path.resolve('./src/lib'),
      '$app': path.resolve('./src/app-mock')
    }
  }
});
