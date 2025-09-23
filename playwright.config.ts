import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	name: 'german-language-tutor-test',
	testDir: './playwright-tests',
	fullyParallel: false, // Disable for simplicity in Windows environment
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : 1, // Single worker for Windows compatibility
	reporter: 'line', // Use line reporter for Windows
	timeout: 30000,
	expect: {
		timeout: 10000
	},
	use: {
		headless: false, // Show browser for debugging
		trace: 'on-first-retry',
		permissions: ['microphone'],
		viewport: { width: 1280, height: 720 },
		launchOptions: {
			args: ['--use-fake-ui-for-media-stream', '--disable-web-security']
		}
	},

	projects: [
		{
			name: 'chromium',
			use: {
				...devices['Desktop Chrome'],
				headless: false
			},
		}
	],

	testMatch: '**/ui-voice-flow.spec.ts', // Only run our new test
	// Disable global setup/teardown for Windows compatibility
	// globalSetup: './playwright-tests/global-setup.ts',
	// globalTeardown: './playwright-tests/global-teardown.ts',
});
