import { chromium } from '@playwright/test';
import * as child_process from 'child_process';

// Global setup - start servers before tests
async function globalSetup() {
	console.log('🏁 Starting servers for Playwright tests...');

	// Start static server
	const staticProcess = child_process.spawn('npm', ['run', 'static'], {
		detached: true,
		stdio: 'ignore'
	});

	// Start WebSocket voice agent server
	const wsProcess = child_process.spawn('npm', ['run', 'server'], {
		detached: true,
		stdio: 'ignore'
	});

	// Start WebRTC signaling server
	const webrtcProcess = child_process.spawn('npm', ['run', 'webrtc'], {
		detached: true,
		stdio: 'ignore'
	});

	// Store PIDs for cleanup
	process.env.STATIC_PID = staticProcess.pid?.toString();
	process.env.WS_PID = wsProcess.pid?.toString();
	process.env.WEBRTC_PID = webrtcProcess.pid?.toString();

	// Wait for servers to start up
	console.log('⏳ Waiting 5 seconds for servers to initialize...');
	await new Promise(resolve => setTimeout(resolve, 5000));

	console.log('✅ Servers started successfully for testing');
}

export default globalSetup;
