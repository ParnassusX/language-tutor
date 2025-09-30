import * as child_process from 'child_process';

// Global teardown - stop servers after tests
async function globalTeardown() {
	console.log('🛑 Stopping servers after Playwright tests...');

	// Kill processes if PIDs are stored
	if (process.env.STATIC_PID) {
		try {
			process.kill(parseInt(process.env.STATIC_PID));
			console.log('✅ Static server stopped');
		} catch (e) {
			console.warn('Warning: could not stop static server:', e.message);
		}
	}

	if (process.env.WS_PID) {
		try {
			process.kill(parseInt(process.env.WS_PID));
			console.log('✅ WebSocket server stopped');
		} catch (e) {
			console.warn('Warning: could not stop WebSocket server:', e.message);
		}
	}

	if (process.env.WEBRTC_PID) {
		try {
			process.kill(parseInt(process.env.WEBRTC_PID));
			console.log('✅ WebRTC server stopped');
		} catch (e) {
			console.warn('Warning: could not stop WebRTC server:', e.message);
		}
	}

	console.log('🧹 Test cleanup completed');
}

export default globalTeardown;
