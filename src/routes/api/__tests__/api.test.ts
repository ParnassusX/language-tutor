import { describe, it, expect, vi } from 'vitest';
import { GET as healthGET } from '../health/+server';
import { GET as diagnosticsGET } from '../diagnostics/+server';
import { GET as voiceAgentGET } from '../voice-agent/+server';

// Mock SvelteKit's dynamic/private env
vi.mock('$env/dynamic/private', () => ({
  env: {
    DEEPGRAM_API_KEY: 'test-deepgram-key',
    DEEPL_API_KEY: 'test-deepl-key',
    GEMINI_API_KEY: 'AIzaSyTestKey',
    JWT_SECRET: 'test-jwt-secret'
  }
}));

describe('API Endpoints', () => {
  it('GET /api/health returns 200 and ok status', async () => {
    const response = await healthGET({} as any);
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.status).toBe('ok');
  });

  it('GET /api/diagnostics returns 200 and diagnostic data', async () => {
    const response = await diagnosticsGET();
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.api_keys.deepgram.exists).toBe(true);
    expect(data.api_keys.gemini.exists).toBe(true);
  });

  it('GET /api/voice-agent returns voice configuration', async () => {
    const mockEvent = {
      url: new URL('http://localhost/api/voice-agent')
    };
    const response = await voiceAgentGET(mockEvent as any);
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.status).toBe('success');
    expect(data.mode).toBe('voice-agent');
    expect(data.websocketUrl).toBe('wss://api.deepgram.com/v1/listen/agent');
  });

  it('GET /api/voice-agent?mode=transcription returns transcription configuration', async () => {
    const mockEvent = {
      url: new URL('http://localhost/api/voice-agent?mode=transcription')
    };
    const response = await voiceAgentGET(mockEvent as any);
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.status).toBe('success');
    expect(data.mode).toBe('transcription');
    expect(data.websocketUrl).toBe('wss://api.deepgram.com/v1/listen');
  });
});
