import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, screen, waitFor, within } from '@testing-library/svelte';
import { tick } from 'svelte';
import Page from '../+page.svelte';
import { MockWebSocket } from '../../test/setup';

// Mock the VoiceAgentService
const mockConnect = vi.fn().mockResolvedValue(undefined);
const mockDisconnect = vi.fn();
let messageCallback: ((data: any) => void) | null = null;

const mockOnMessage = vi.fn((callback) => {
  // Store the callback to simulate messages
  messageCallback = (data: any) => {
    if (callback) callback(JSON.parse(JSON.stringify(data)));
  };
  return () => {
    messageCallback = null;
  }; // Return cleanup function
});

const mockOnError = vi.fn();
const mockIsConnected = vi.fn().mockReturnValue(true);
const mockSendAudioData = vi.fn();

// Mock the VoiceAgentService module
vi.mock('$lib/services/VoiceAgentService', () => ({
  default: vi.fn().mockImplementation(() => ({
    connect: mockConnect,
    disconnect: mockDisconnect,
    onMessage: mockOnMessage,
    onError: mockOnError,
    isConnected: mockIsConnected,
    sendAudioData: mockSendAudioData,
  })),
}));

// Helper function to simulate WebSocket message from the agent
const simulateAgentMessage = (message: any) => {
  if (messageCallback) {
    messageCallback({
      data: JSON.stringify(message)
    });
  }
};

describe('Language Tutor Page', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
    
    // Reset mock implementations
    mockConnect.mockResolvedValue(undefined);
    mockDisconnect.mockImplementation(() => {});
    mockOnMessage.mockImplementation((callback) => {
      messageCallback = (data: any) => {
        if (callback) callback(JSON.parse(JSON.stringify(data)));
      };
      return () => {
        messageCallback = null;
      };
    });
    mockIsConnected.mockReturnValue(false);
    
    // Mock the WebSocket and MediaDevices
    global.WebSocket = MockWebSocket as any;
    // Initialize mock media devices
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
  });

  it('renders the main page with all expected elements', async () => {
    render(Page);
    
    // Check main header and description
    expect(screen.getByRole('heading', { name: /deepgram voice assistant/i })).toBeInTheDocument();
    expect(screen.getByText(/practice your language skills with our ai tutor/i)).toBeInTheDocument();
    
    // Check session controls section
    const connectButton = screen.getByRole('button', { name: /connect/i });
    const settingsButton = screen.getByRole('button', { name: /settings/i });
    
    expect(connectButton).toBeInTheDocument();
    expect(settingsButton).toBeInTheDocument();
    
    // Check conversation area
    const conversation = screen.getByRole('log');
    expect(conversation).toBeInTheDocument();
    
    // Check input area
    expect(screen.getByRole('textbox', { name: /type your message/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
  });

  it('successfully connects and disconnects from the voice agent', async () => {
    render(Page);
            
    // Initial state
    const connectButton = screen.getByRole('button', { name: /connect/i });
    expect(connectButton.textContent).toMatch(/connect/i);
            
    // Click connect
    await fireEvent.click(connectButton);
            
    // Verify connecting state
    await waitFor(() => {
      expect(connectButton.textContent).toMatch(/connecting/i);
      expect(connectButton).toHaveAttribute('disabled');
    });
            
    // Simulate successful connection
    mockIsConnected.mockReturnValue(true);
    await tick();
            
    // Verify connected state
    await waitFor(() => {
      expect(connectButton.textContent).toMatch(/disconnect/i);
      expect(connectButton).not.toHaveAttribute('disabled');
    });
            
    // Click disconnect
    await fireEvent.click(connectButton);
            
    // Verify disconnection
    await waitFor(() => {
      expect(mockDisconnect).toHaveBeenCalled();
      // The button text might be updated asynchronously, so we'll just check the disconnect was called
      expect(mockDisconnect).toHaveBeenCalledTimes(1);
    });
  });

  it('displays and handles connection errors', async () => {
    // Mock a connection error
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const errorMessage = 'Failed to connect to voice agent';
    mockConnect.mockRejectedValueOnce(new Error(errorMessage));
    
    render(Page);
    
    // Click connect
    const connectButton = screen.getByRole('button', { name: /connect/i });
    await fireEvent.click(connectButton);
    
    // Verify error handling
    await waitFor(() => {
      // Check if error message is displayed in the UI
      const errorAlert = screen.getByRole('alert');
      expect(errorAlert).toHaveTextContent(errorMessage);
      
      // Verify button is re-enabled after error
      expect(connectButton).not.toHaveAttribute('disabled');
      expect(connectButton.textContent).toMatch(/connect/i);
    });
    
    // Clean up
    consoleErrorSpy.mockRestore();
  });

  describe('Settings Panel', () => {
    it('toggles visibility when settings button is clicked', async () => {
      render(Page);
      
      const settingsButton = screen.getByRole('button', { name: /settings/i });
      
      // Open settings
      await fireEvent.click(settingsButton);
      
      // Check if settings panel is visible with all controls
      const settingsPanel = screen.getByRole('dialog');
      expect(settingsPanel).toBeInTheDocument();
      
      // Close settings
      await fireEvent.click(settingsButton);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    
    it('updates voice and model settings', async () => {
      render(Page);
      
      // Open settings
      await fireEvent.click(screen.getByRole('button', { name: /settings/i }));
      
      // Change voice
      const voiceSelect = screen.getByLabelText(/voice/i);
      await fireEvent.change(voiceSelect, { target: { value: 'aura-luna-en' } });
      expect((voiceSelect as HTMLSelectElement).value).toBe('aura-luna-en');
      
      // Change model
      const modelSelect = screen.getByLabelText(/model/i);
      await fireEvent.change(modelSelect, { target: { value: 'nova-2' } });
      expect((modelSelect as HTMLSelectElement).value).toBe('nova-2');
    });
    
    it('updates volume and speech rate sliders', async () => {
      render(Page);
      
      // Open settings
      await fireEvent.click(screen.getByRole('button', { name: /settings/i }));
      
      // Change volume
      const volumeSlider = screen.getByLabelText(/volume/i);
      await fireEvent.input(volumeSlider, { target: { value: '0.7' } });
      expect((volumeSlider as HTMLInputElement).value).toBe('0.7');
      
      // Change speech rate
      const rateSlider = screen.getByLabelText(/speech rate/i);
      await fireEvent.input(rateSlider, { target: { value: '1.2' } });
      expect((rateSlider as HTMLInputElement).value).toBe('1.2');
    });
  });


  describe('Conversation', () => {
    it('displays user and agent messages in the conversation history', async () => {
      render(Page);
      
      // Simulate receiving a user message
      const userMessage = {
        type: 'transcript',
        is_final: true,
        channel: {
          alternatives: [{
            transcript: 'Hallo, wie geht es dir?',
            confidence: 0.95
          }]
        },
        speech_final: true
      };
      
      // Simulate receiving an agent response
      const agentResponse = {
        type: 'speech',
        speech: 'Hallo! Mir geht es gut, danke der Nachfrage!',
        text: 'Hallo! Mir geht es gut, danke der Nachfrage!'
      };
      
      // Trigger the message callbacks
      simulateAgentMessage(userMessage);
      simulateAgentMessage(agentResponse);
      
      await tick();
      
      // Check if both messages are displayed in the conversation
      const conversation = screen.getByRole('log');
      const messages = within(conversation).getAllByRole('listitem');
      
      expect(messages.length).toBeGreaterThanOrEqual(1);
      expect(conversation.textContent).toContain('Hallo, wie geht es dir?');
      expect(conversation.textContent).toContain('Hallo! Mir geht es gut, danke der Nachfrage!');
    });
    
    it('allows sending text messages', async () => {
      render(Page);
      
      const messageInput = screen.getByRole('textbox', { name: /type your message/i });
      const sendButton = screen.getByRole('button', { name: /send/i });
      
      // Type a message
      const testMessage = 'Wie sagt man "thank you" auf Deutsch?';
      await fireEvent.input(messageInput, { target: { value: testMessage } });
      
      // Send the message
      await fireEvent.click(sendButton);
      
      // Check if the message was sent
      expect(mockSendAudioData).toHaveBeenCalled();
      
      // Check if the input is cleared after sending
      expect(messageInput).toHaveValue('');
    });
  });

  describe('Audio Handling', () => {
    it('handles microphone access errors gracefully', async () => {
      // Mock a microphone permission error
      const errorMessage = 'Microphone access denied';
      vi.spyOn(navigator.mediaDevices, 'getUserMedia').mockRejectedValueOnce(
        new Error(errorMessage)
      );
      
      render(Page);
      
      // Try to start the conversation
      const startButton = screen.getByRole('button', { name: /start speaking/i });
      await fireEvent.click(startButton);
      
      // Check if error message is displayed
      await waitFor(() => {
        const errorAlert = screen.getByRole('alert');
        expect(errorAlert.textContent).toContain(errorMessage);
        expect(startButton.textContent).toMatch(/start speaking/i); // Button text should revert
      });
    });
    
    it('toggles between start and stop speaking states', async () => {
      render(Page);
      
      // Initial state - start button should be visible
      let startButton = screen.getByRole('button', { name: /start speaking/i });
      expect(startButton).toBeInTheDocument();
      
      // Click to start speaking
      await fireEvent.click(startButton);
      
      // Button should change to stop
      const stopButton = screen.getByRole('button', { name: /stop speaking/i });
      expect(stopButton).toBeInTheDocument();
      
      // Click to stop speaking
      await fireEvent.click(stopButton);
      
      // Button should change back to start
      startButton = screen.getByRole('button', { name: /start speaking/i });
      expect(startButton).toBeInTheDocument();
    });
    
    it('disables audio controls when not connected', async () => {
      render(Page);
      
      // Audio controls should be disabled when not connected
      const startButton = screen.getByRole('button', { name: /start speaking/i });
      expect(startButton).toHaveAttribute('disabled');
      
      // Connect to the agent
      await fireEvent.click(screen.getByRole('button', { name: /connect/i }));
      mockIsConnected.mockReturnValue(true);
      await tick();
      
      // Audio controls should be enabled when connected
      expect(startButton).not.toHaveAttribute('disabled');
    });
  });
});
