import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, screen, waitFor, cleanup } from '@testing-library/svelte';
import { tick } from 'svelte';
import Page from '../+page.svelte';
import { MockWebSocket } from '../../test/setup';

describe('Language Tutor Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.WebSocket = MockWebSocket as any;

    Object.defineProperty(navigator, 'mediaDevices', {
      writable: true,
      value: {
        getUserMedia: vi.fn().mockResolvedValue(new MediaStream()),
      },
    });

    // Mock AudioContext
    const mockAudioContext = {
      decodeAudioData: vi.fn((_, success) => success(new ArrayBuffer(8))),
      createBufferSource: vi.fn(() => ({
        connect: vi.fn(),
        start: vi.fn(),
        buffer: null,
      })),
      resume: vi.fn(),
      state: 'running',
      destination: 'mock-destination',
    };

    // Use vi.spyOn to mock the constructor
    vi.spyOn(window, 'AudioContext').mockImplementation(() => mockAudioContext as any);
  });

  afterEach(() => {
    MockWebSocket.clearInstances();
    cleanup();
  });

  it('renders the main page with all expected elements', () => {
    render(Page);
    expect(screen.getByRole('heading', { name: /german language tutor/i })).toBeInTheDocument();
    expect(screen.getByTestId('connect-button')).toBeInTheDocument();
    expect(screen.getByTestId('translation-button')).toBeInTheDocument();
    expect(screen.getByText('Conversation')).toBeInTheDocument();
    expect(screen.getByTestId('record-button')).toBeInTheDocument();
    expect(screen.getByText('Debug Info')).toBeInTheDocument();
  });

  it('successfully connects and disconnects from the voice agent', async () => {
    render(Page);
    const connectButton = screen.getByTestId('connect-button');
    expect(connectButton).not.toBeDisabled();

    // Connect
    await fireEvent.click(connectButton);

    await waitFor(() => {
      expect(screen.getByText(/connecting/i)).toBeInTheDocument();
    });

    const ws = MockWebSocket.instances[0];
    ws.triggerOpen();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /disconnect/i })).toBeInTheDocument();
    });

    // Disconnect
    const disconnectButton = screen.getByRole('button', { name: /disconnect/i });
    await fireEvent.click(disconnectButton);

    await waitFor(() => {
      expect(screen.getByTestId('connect-button')).toBeInTheDocument();
    });
    expect(ws.close).toHaveBeenCalled();
  });

  it('toggles recording when connected', async () => {
    render(Page);
    const connectButton = screen.getByTestId('connect-button');
    const recordButton = screen.getByTestId('record-button');

    expect(recordButton).toBeDisabled();

    // Connect
    await fireEvent.click(connectButton);
    const ws = MockWebSocket.instances[0];
    ws.triggerOpen();

    await waitFor(() => {
      expect(recordButton).not.toBeDisabled();
    });

    // Start recording
    await fireEvent.click(recordButton);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /🎤 mute/i })).toBeInTheDocument();
    });

    // Stop recording
    await fireEvent.click(recordButton);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /🎤 unmute/i })).toBeInTheDocument();
    });
  });

  it('displays transcription messages from the agent', async () => {
    render(Page);
    const connectButton = screen.getByTestId('connect-button');
    await fireEvent.click(connectButton);

    const ws = MockWebSocket.instances[0];
    ws.triggerOpen();
    await tick();

    const message = {
      type: 'transcription',
      channel: {
        alternatives: [{ transcript: 'Hello there' }]
      }
    };
    ws.triggerMessage(JSON.stringify(message));

    await waitFor(() => {
      expect(screen.getByText('Hello there')).toBeInTheDocument();
    });
  });

  it('handles microphone access errors gracefully', async () => {
    const errorMessage = 'Microphone access denied';
    (navigator.mediaDevices.getUserMedia as vi.Mock).mockRejectedValueOnce(new Error(errorMessage));

    render(Page);
    const connectButton = screen.getByTestId('connect-button');
    await fireEvent.click(connectButton);

    await waitFor(() => {
      expect(screen.getByText(/audio initialization failed/i)).toBeInTheDocument();
      expect(screen.getByText(new RegExp(errorMessage))).toBeInTheDocument();
    });
  });
});
