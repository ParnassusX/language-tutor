import { test, expect, Page, BrowserContext } from '@playwright/test';

test.describe('German Language Tutor - WebRTC Live Calls', () => {
	let page1: Page;
	let page2: Page;
	let context1: BrowserContext;
	let context2: BrowserContext;

	test.beforeAll(async ({ browser }) => {
		// Create two browser contexts with audio permissions
		context1 = await browser.newContext({
			permissions: ['microphone'],
		});

		context2 = await browser.newContext({
			permissions: ['microphone'],
		});

		// Create pages
		page1 = await context1.newPage();
		page2 = await context2.newPage();

		// Navigate both pages to the app
		await page1.goto('/');
		await page2.goto('/');

		console.log('✅ Browser setup complete for dual WebRTC testing');
	});

	test.afterAll(async () => {
		// Clean up browser contexts
		await context1.close();
		await context2.close();
		console.log('✅ Browser cleanup completed');
	});

	test('Page loads correctly', async () => {
		await expect(page1.locator('h1')).toContainText('German Language Tutor - Enhanced 2025');
		await expect(page2.locator('h1')).toContainText('German Language Tutor - Enhanced 2025');
		console.log('✅ Both pages loaded successfully');
	});

	test('API endpoint test works', async () => {
		// Test API on page1
		await page1.click('button:has-text("Test API Endpoint")');
		await expect(page1.locator('.result')).toContainText('success');
		console.log('✅ API endpoint test passed');
	});

	test('Mode switching functionality', async () => {
		// Test switching to AI mode on page1
		await page1.click('button:has-text("🤖 Practice with AI Tutor")');
		await expect(page1.locator('.ai-mode')).toBeVisible();
		await expect(page1.locator('text=Cost savings')).toBeVisible();

		// Test switching to live mode on page1
		await page1.click('button:has-text("👥 Live Peer-to-Peer Practice")');
		await expect(page1.locator('.live-mode')).toBeVisible();
		await expect(page1.locator('text=WebRTC peer-to-peer connection')).toBeVisible();

		console.log('✅ Mode switching works correctly');
	});

	test('WebRTC peer-to-peer connection establishment', async () => {
		const testRoom = 'playwright-webrtc-test-' + Date.now();

		// Page1 - Switch to live mode and join room
		await page1.click('button:has-text("👥 Live Peer-to-Peer Practice")');
		await page1.fill('input[placeholder*="room ID"]', testRoom);
		await page1.click('button:has-text("Join Room")');

		// Wait for room join confirmation
		await expect(page1.locator('text=Joined room')).toBeVisible({ timeout: 10000 });

		// Page2 - Switch to live mode and join same room
		await page2.click('button:has-text("👥 Live Peer-to-Peer Practice")');
		await page2.fill('input[placeholder*="room ID"]', testRoom);
		await page2.click('button:has-text("Join Room")');

		// Wait for room join confirmation on page2
		await expect(page2.locator('text=Joined room')).toBeVisible({ timeout: 10000 });

		// Check that peers can see each other
		await expect(page1.locator('.peer-list')).toContainText('client_', { timeout: 15000 });
		await expect(page2.locator('.peer-list')).toContainText('client_', { timeout: 15000 });

		console.log('✅ Peers can see each other in the room');

		// Test media startup (mock microphone permission)
		await page1.click('button:has-text("🎤 Start Media")');
		await page2.click('button:has-text("🎤 Start Media")');

		// Wait for connection establishment
		await expect(page1.locator('.connection-status')).toContainText('connected', { timeout: 30000 });
		await expect(page2.locator('.connection-status')).toContainText('connected', { timeout: 30000 });

		console.log('✅ WebRTC connection established between peers!');

		// Test call timer functionality
		await expect(page1.locator('.call-timer')).toBeVisible();
		await expect(page2.locator('.call-timer')).toBeVisible();
		await expect(page1.locator('.call-timer')).toContainText('00:');
		await expect(page2.locator('.call-timer')).toContainText('00:');

		console.log('✅ Call timers are working');

		// Keep connection alive for 10 seconds to test stability
		await page1.waitForTimeout(10000);
		await page2.waitForTimeout(10000);

		// Verify connections still stable
		await expect(page1.locator('.connection-status')).toContainText('connected');
		await expect(page2.locator('.connection-status')).toContainText('connected');

		console.log('✅ WebRTC connections remain stable over time');

		// Test disconnection
		await page1.click('button:has-text("Leave Room")');
		await page2.click('button:has-text("Leave Room")');

		await expect(page1.locator('.connection-status')).toContainText('disconnected');
		await expect(page2.locator('.connection-status')).toContainText('disconnected');

		console.log('✅ WebRTC disconnection handled correctly');
	});

	test('Comprehensive feature verification', async () => {
		// Test multiple mode switches
		await page1.click('button:has-text("🤖 Practice with AI Tutor")');
		await expect(page1.locator('.ai-mode')).toBeVisible();

		await page1.click('button:has-text("👥 Live Peer-to-Peer Practice")');
		await expect(page1.locator('.live-mode')).toBeVisible();

		console.log('✅ Comprehensive UI functionality verified');
	});
});
