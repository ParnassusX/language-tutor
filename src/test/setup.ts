// Test setup file
import { vi, beforeAll, expect, afterEach } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';
import { browser } from './browser-mock';
import '@testing-library/jest-dom/vitest';

// Extend Vitest's expect with jest-dom matchers
// @ts-ignore - matchers type issue
Object.entries(matchers).forEach(([name, matcher]) => {
  expect.extend({ [name]: matcher });
});

// Set up browser environment
beforeAll(() => {
  // Mock browser APIs
  Object.defineProperty(global, 'window', {
    value: globalThis,
    writable: true
  });

  // Mock browser environment
  Object.defineProperty(global, 'browser', {
    value: browser,
    writable: true
  });
});

// Mock WebSocket
export class MockWebSocket {
  private static _instances: MockWebSocket[] = [];
  static get instances(): ReadonlyArray<MockWebSocket> {
    return this._instances;
  }
  
  static messageCallback: ((event: { data: string }) => void) | null = null;
  
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  readyState = 0; // CONNECTING
  sentData: any[] = [];

  // Method to trigger successful connection (for testing)
  triggerOpen() {
    this.readyState = 1; // OPEN
    if (this.onopen) {
      this.onopen();
    }
  }

  // Method to trigger close (for testing)
  triggerClose() {
    this.readyState = 3; // CLOSED
    if (this.onclose) {
      this.onclose();
    }
  }

  // Method to trigger error (for testing)
  triggerError(event: Event = new Event('error')) {
    if (this.onerror) {
      this.onerror(event);
    }
  }

  constructor(public url: string) {
    MockWebSocket._instances.push(this);
    // Don't automatically trigger open - let tests control this
  }

  send(data: any) {
    this.sentData.push(data);
    
    // Simulate response for testing
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
      this.onmessage({ data: JSON.stringify(response) } as MessageEvent);
    }
  }

  close() {
    this.readyState = 3; // CLOSED
    if (this.onclose) this.onclose();
  }

  static clear() {
    MockWebSocket._instances = [];
  }
}

// Mock browser APIs
Object.defineProperty(window, 'WebSocket', {
  writable: true,
  value: MockWebSocket,
});

// Mock mediaDevices
export const mockMediaDevices = () => {
  Object.defineProperty(navigator, 'mediaDevices', {
    writable: true,
    value: {
      getUserMedia: vi.fn(() => Promise.resolve(new MediaStream())),
      enumerateDevices: vi.fn(() =>
        Promise.resolve([
          { kind: 'audioinput', deviceId: 'mic1', label: 'Microphone' }
        ])
      )
    }
  });
};

// Mock AudioContext
Object.defineProperty(window, 'AudioContext', {
  writable: true,
  value: class {
    createAnalyser() {
      return {
        fftSize: 2048,
        frequencyBinCount: 1024,
        getByteFrequencyData: vi.fn(),
        getByteTimeDomainData: vi.fn()
      };
    }
    createMediaStreamSource() {
      return {
        connect: vi.fn(),
        disconnect: vi.fn()
      };
    }
    createScriptProcessor() {
      return {
        connect: vi.fn(),
        disconnect: vi.fn(),
        onaudioprocess: null
      };
    }
  }
});

// Mock MediaRecorder
Object.defineProperty(window, 'MediaRecorder', {
  writable: true,
  value: class {
    static isTypeSupported = vi.fn(() => true);
    ondataavailable: ((event: { data: Blob }) => void) | null = null;
    state = 'inactive';
    
    constructor(public stream: MediaStream) {}
    
    start() {
      this.state = 'recording';
    }
    
    stop() {
      this.state = 'inactive';
    }
    
    requestData() {
      if (this.ondataavailable) {
        this.ondataavailable({ data: new Blob(['test'], { type: 'audio/wav' }) });
      }
    }
  }
});

// Mock MediaStream
Object.defineProperty(window, 'MediaStream', {
  writable: true,
  value: class MediaStream {}
});

// Mock navigator.mediaDevices
Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: vi.fn(() =>
      Promise.resolve(new MediaStream())
    ),
    enumerateDevices: vi.fn(() =>
      Promise.resolve([
        { kind: 'audioinput', deviceId: 'mic1', label: 'Microphone' }
      ])
    )
  }
});

// Cleanup after each test
afterEach(() => {
  vi.clearAllMocks();
  MockWebSocket.clear();
});
