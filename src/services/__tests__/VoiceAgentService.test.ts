import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { VoiceAgentService } from '../VoiceAgentService';
import { MockWebSocket, mockMediaDevices } from '../../test/setup';

describe('VoiceAgentService', () => {
  let service: VoiceAgentService;
  
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
    MockWebSocket.clear();
    mockMediaDevices();
    
    // Create a new instance for each test
    service = new VoiceAgentService('ws://test-server');
  });
  
  afterEach(() => {
    service.disconnect();
  });
  
  it('should initialize with default values', () => {
    expect(service).toBeDefined();
    expect(service.isConnected()).toBe(false);
  });
  
  it('should connect to the WebSocket server', async () => {
    await service.connect();
    expect(service.isConnected()).toBe(true);
  });
  
  it('should handle WebSocket connection errors', async () => {
    const errorCallback = vi.fn();
    service.onError(errorCallback);
    
    // Simulate WebSocket error
    await service.connect();
    const ws = MockWebSocket.instances[0];
    ws.onerror?.(new Event('error'));
    
    expect(errorCallback).toHaveBeenCalled();
  });
  
  it('should handle incoming messages', async () => {
    const messageCallback = vi.fn();
    service.onMessage(messageCallback);
    
    await service.connect();
    const ws = MockWebSocket.instances[0];
    
    // Simulate incoming message
    const testMessage = { type: 'test', data: 'Hello' };
    ws.onmessage?.({ data: JSON.stringify(testMessage) } as MessageEvent);
    
    expect(messageCallback).toHaveBeenCalledWith(testMessage);
  });
  
  it('should handle disconnection', async () => {
    await service.connect();
    expect(service.isConnected()).toBe(true);
    
    service.disconnect();
    expect(service.isConnected()).toBe(false);
  });
  
  it('should attempt to reconnect on connection loss', async () => {
    vi.useFakeTimers();
    
    await service.connect();
    const ws = MockWebSocket.instances[0];
    
    // Simulate connection loss
    ws.onclose?.();
    
    // Fast-forward time to trigger reconnection
    await vi.advanceTimersByTimeAsync(1000);
    
    // Should have created a new WebSocket connection
    expect(MockWebSocket.instances.length).toBe(2);
    
    vi.useRealTimers();
  });
  
  it('should handle audio data processing', async () => {
    await service.connect();
    
    // Mock audio data
    const audioData = new Float32Array(1024).fill(0.5);
    
    // This would normally be called by the audio processing callback
    service.sendAudioData(audioData);
    
    // In our mock, we can't directly test the WebSocket send,
    // but we can verify the method was called with the right data
    const ws = MockWebSocket.instances[0] as any;
    expect(ws.sentData.length).toBeGreaterThan(0);
  });
  
  it('should handle audio context errors', async () => {
    // Mock AudioContext error
    const mockAudioContext = {
      createMediaStreamSource: vi.fn().mockImplementation(() => {
        throw new Error('AudioContext error');
      }),
      close: vi.fn(),
      state: 'running',
    };
    
    // @ts-ignore
    window.AudioContext = vi.fn().mockImplementation(() => mockAudioContext);
    
    const errorCallback = vi.fn();
    service.onError(errorCallback);
    
    await service.connect();
    
    expect(errorCallback).toHaveBeenCalledWith(expect.any(Error));
  });
  
  it('should clean up resources on disconnect', async () => {
    await service.connect();
    
    // Mock the audio context and processor
    const mockDisconnect = vi.fn();
    // @ts-ignore
    service['audioInput'] = { disconnect: mockDisconnect };
    // @ts-ignore
    service['processor'] = { disconnect: mockDisconnect };
    
    service.disconnect();
    
    expect(mockDisconnect).toHaveBeenCalledTimes(2);
    expect(service.isConnected()).toBe(false);
  });
});
