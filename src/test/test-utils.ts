// Test utilities and helpers

/**
 * Mocks the Web Audio API for testing
 */
export function mockWebAudioAPI() {
  // @ts-ignore
  window.AudioContext = class {
    createAnalyser() {
      return {
        fftSize: 2048,
        frequencyBinCount: 1024,
        getByteFrequencyData: () => {},
        getByteTimeDomainData: () => {}
      };
    }
    createMediaStreamSource() {
      return {
        connect: () => {},
        disconnect: () => {}
      };
    }
  };
}

/**
 * Mocks the MediaDevices API for testing
 */
export function mockMediaDevices() {
  // @ts-ignore
  navigator.mediaDevices = {
    getUserMedia: async () => {
      return new MediaStream();
    }
  };
}

/**
 * Creates a test audio blob
 */
export function createTestAudioBlob(): Blob {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const destination = audioContext.createMediaStreamDestination();
  oscillator.connect(destination);
  oscillator.start();
  
  return new Blob([], { type: 'audio/wav' });
}

/**
 * Waits for a condition to be true
 */
export async function waitFor(condition: () => boolean, timeout = 1000) {
  return new Promise<void>((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      if (condition()) {
        resolve();
      } else if (Date.now() - start > timeout) {
        reject(new Error('Timeout waiting for condition'));
      } else {
        setTimeout(check, 10);
      }
    };
    check();
  });
}

// Mock the WebSocket for testing
export class MockWebSocket {
  static instances: MockWebSocket[] = [];
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;
  readyState = 0; // CONNECTING

  constructor() {
    MockWebSocket.instances.push(this);
    setTimeout(() => {
      this.readyState = 1; // OPEN
      if (this.onopen) this.onopen();
    }, 10);
  }

  send(data: string) {
    // Simulate response
    if (this.onmessage) {
      const response = {
        type: 'transcript',
        channel: {
          alternatives: [{
            transcript: 'Hallo, wie geht es dir?',
            confidence: 0.95
          }]
        }
      };
      this.onmessage({ data: JSON.stringify(response) });
    }
  }

  close() {
    this.readyState = 3; // CLOSED
    if (this.onclose) this.onclose();
  }

  static clear() {
    MockWebSocket.instances = [];
  }
}
