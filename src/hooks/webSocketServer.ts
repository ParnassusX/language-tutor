// src/hooks/webSocketServer.ts
import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';
import 'dotenv/config'

export function configureWebSocketServer(server: Server) {
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws) => {
    console.log('Client connected');

    const deepgramSocket = new WebSocket(`wss://api.deepgram.com/v1/listen/agent`, {
      headers: {
        Authorization: `Token ${process.env.DEEPGRAM_API_KEY}`
      }
    });

    deepgramSocket.onopen = () => {
      console.log('Connected to Deepgram');
      // Forward messages from client to Deepgram
      ws.on('message', (message) => {
        deepgramSocket.send(message);
      });
    };

    // Forward messages from Deepgram to client
    deepgramSocket.onmessage = (event) => {
      ws.send(event.data);
    };

    deepgramSocket.onclose = () => {
      console.log('Disconnected from Deepgram');
      ws.close();
    };

    deepgramSocket.onerror = (error) => {
      console.error('Deepgram WebSocket error:', error);
      ws.close();
    };

    ws.on('close', () => {
      console.log('Client disconnected');
      deepgramSocket.close();
    });
  });
}
