import { WebSocketServer } from 'ws';
import { createClient } from '@deepgram/sdk';
import { createServer } from 'http';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { textToSpeech } from './tts.js'; // Assuming tts.js handles TTS

// Load environment variables from the root directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Configuration
const PORT = process.env.WS_PORT || 3001;
const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Validate required environment variables
if (!DEEPGRAM_API_KEY || !GEMINI_API_KEY) {
    console.error('Missing required environment variables: DEEPGRAM_API_KEY and GEMINI_API_KEY must be set.');
    process.exit(1);
}

// Initialize APIs
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const deepgram = createClient(DEEPGRAM_API_KEY);

// System prompt for the language tutor
const SYSTEM_PROMPT = `You are a friendly and patient German language tutor. 
Help the user practice German in a natural, conversational way. 
Keep your responses concise and focused on language learning. 
If the user makes mistakes, gently correct them and provide examples.`;

// Create HTTP and WebSocket servers
const server = createServer();
const wss = new WebSocketServer({ server });

// Client state is managed per-connection

// Handle new WebSocket connections
wss.on('connection', (ws, req) => {
    const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log(`[${clientId}] New WebSocket connection from ${req.socket.remoteAddress}`);

    const clientData = {
        id: clientId,
        ws,
        deepgramWs: null,
        conversationHistory: [{ role: 'system', parts: [{ text: SYSTEM_PROMPT }] }],
        language: 'de', // Default language
    };

    

    initializeDeepgramConnection(clientData);

    ws.on('message', (message) => {
        // Forward audio data to Deepgram
        if (clientData.deepgramWs && clientData.deepgramWs.readyState === WebSocket.OPEN) {
            clientData.deepgramWs.send(message);
        } else {
            console.warn(`[${clientId}] Deepgram connection not ready. Audio chunk dropped.`);
        }
    });

    ws.on('close', () => {
        console.log(`[${clientId}] Client disconnected`);

        if (clientData.deepgramWs && clientData.deepgramWs.readyState !== WebSocket.CLOSED) {
            clientData.deepgramWs.disconnect();
        }
    });

    ws.on('error', (error) => {
        console.error(`[${clientId}] WebSocket error:`, error);
    });
});

/**
 * Initializes and manages the WebSocket connection to Deepgram for a client.
 * @param {object} clientData - The client's data object.
 */
function initializeDeepgramConnection(clientData) {
                const deepgramConnection = deepgram.listen.live({
        model: 'nova-2-conversationalai',
        punctuate: true,
    });

    const deepgramWs = deepgramConnection;

    deepgramWs.on('open', () => {
        console.log(`[${clientData.id}] Deepgram connection established.`);
        clientData.deepgramWs = deepgramWs;
    });

    deepgramWs.on('message', (data) => {
        const result = JSON.parse(data.toString());
        if (result.type === 'Results' && result.is_final) {
            const transcript = result.channel?.alternatives?.[0]?.transcript;
            if (transcript && transcript.trim()) {
                                console.log(`[${clientData.id}] Final transcript received: "${transcript}"`);
                handleTranscript(clientData, transcript);
            }
        }
    });

    deepgramWs.on('close', (code, reason) => {
        console.log(`[${clientData.id}] Deepgram connection closed. Code: ${code}, Reason: ${reason}`);
        clientData.deepgramWs = null;
        // Optional: Implement reconnection logic here if needed
    });

    deepgramWs.on('error', (error) => {
        console.error(`[${clientData.id}] Deepgram connection error:`, error);
    });
}

/**
 * Handles the final transcript from Deepgram, gets an AI response, and sends it back.
 * @param {object} clientData - The client's data object.
 * @param {string} transcript - The transcribed text from the user.
 */
async function handleTranscript(clientData, transcript) {
    // Add user's message to conversation history
    clientData.conversationHistory.push({ role: 'user', parts: [{ text: transcript }] });

    // Send transcript to client for display
    clientData.ws.send(JSON.stringify({ type: 'user_transcript', text: transcript }));

    try {
        // Get AI response from Gemini
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const chat = model.startChat({ history: clientData.conversationHistory });
        const result = await chat.sendMessage(transcript);
        const aiResponseText = await result.response.text();

                console.log(`[${clientData.id}] AI Response: "${aiResponseText}"`);

        // Add AI's response to history
        clientData.conversationHistory.push({ role: 'model', parts: [{ text: aiResponseText }] });

        // Send AI text response to client for display
        clientData.ws.send(JSON.stringify({ type: 'ai_response_text', text: aiResponseText }));

        // Generate and stream TTS audio for the AI response
                const audioStream = await textToSpeech(aiResponseText, { voice: 'aura-arcas-de' });
        for await (const chunk of audioStream) {
            if (clientData.ws.readyState === WebSocket.OPEN) {
                clientData.ws.send(chunk);
            }
        }

    } catch (error) {
        console.error(`[${clientData.id}] Error getting AI response or TTS:`, error);
        clientData.ws.send(JSON.stringify({ type: 'error', message: 'Failed to get AI response.' }));
    }
}

// Start the server
server.listen(PORT, () => {
    console.log(`WebSocket server running on port ${PORT}`);
});
