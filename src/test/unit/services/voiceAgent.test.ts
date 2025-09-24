import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { VoiceAgentService } from '../../../../src/services/VoiceAgentService';
import { MockWebSocket } from '../../../../src/test/setup';

// Mock WebSocket
vi.stubGlobal('WebSocket', MockWebSocket);

describe('VoiceAgentService', () => {
  let service: VoiceAgentService;
  
  beforeEach(() => {
    service = new VoiceAgentService();
    MockWebSocket.clear();
  });

  afterEach(() => {
    service.disconnect();
  });

  it('should connect to the voice agent', async () => {
    await service.connect();
    expect(service.isConnected()).toBe(true);
  });

  it('should handle incoming messages', async () => {
    const mockCallback = vi.fn();
    await service.connect();
    
    service.onMessage(mockCallback);
    
    // Simulate message from server
    const testMessage = { type: 'transcript', text: 'Hallo' };
    const ws = MockWebSocket.instances[0];
    ws.onmessage?.({ data: JSON.stringify(testMessage) } as MessageEvent);
    
    expect(mockCallback).toHaveBeenCalledWith(testMessage);
  });

  it('should send audio data', async () => {
    await service.connect();
    const testData = new Float32Array([1, 2, 3]);
    
    service.sendAudioData(testData);
    
    const ws = MockWebSocket.instances[0] as any;
    // Convert Float32Array to regular array for comparison
    const sentData = Array.from(ws.sentData[0]);
    expect(sentData).toEqual(Array.from(testData));
  });

  it('should handle disconnection', async () => {
    await service.connect();
    service.disconnect();
    
    expect(service.isConnected()).toBe(false);
  });

  it('should handle errors', async () => {
    const errorCallback = vi.fn();
    await service.connect();
    
    service.onError(errorCallback);
    
    const ws = MockWebSocket.instances[0];
    const errorEvent = new ErrorEvent('error', {
      message: 'Test error',
      error: new Error('Test error')
    });
    ws.onerror?.(errorEvent);
    
    expect(errorCallback).toHaveBeenCalled();
  });
});
