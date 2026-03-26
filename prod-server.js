import { handler } from './build/handler.js';
import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import 'dotenv/config';

const app = express();
const server = createServer(app);

// Configure WebSocket Server
const wss = new WebSocketServer({ server });

wss.on('connection', (ws, req) => {
  console.log(`[${new Date().toISOString()}] Client connected to WebSocket`);

  if (!process.env.DEEPGRAM_API_KEY) {
    console.error('❌ DEEPGRAM_API_KEY is missing');
    ws.close(1011, 'Server configuration error');
    return;
  }

  const deepgramSocket = new WebSocket('wss://api.deepgram.com/v1/listen/agent', {
    headers: {
      Authorization: `Token ${process.env.DEEPGRAM_API_KEY}`
    }
  });

  deepgramSocket.on('open', () => {
    console.log('✅ Connected to Deepgram');

    ws.on('message', (message) => {
      if (deepgramSocket.readyState === WebSocket.OPEN) {
        deepgramSocket.send(message);
      }
    });
  });

  deepgramSocket.on('message', (data) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(data);
    }
  });

  deepgramSocket.on('close', (code, reason) => {
    console.log(`[${new Date().toISOString()}] Deepgram connection closed: ${code} ${reason}`);
    ws.close(code, reason);
  });

  deepgramSocket.on('error', (error) => {
    console.error('❌ Deepgram WebSocket error:', error);
    ws.close(1011, 'Deepgram error');
  });

  ws.on('close', () => {
    console.log(`[${new Date().toISOString()}] Client disconnected`);
    if (deepgramSocket.readyState === WebSocket.OPEN || deepgramSocket.readyState === WebSocket.CONNECTING) {
      deepgramSocket.close();
    }
  });

  ws.on('error', (error) => {
    console.error('❌ Client WebSocket error:', error);
    if (deepgramSocket.readyState === WebSocket.OPEN || deepgramSocket.readyState === WebSocket.CONNECTING) {
      deepgramSocket.close();
    }
  });
});

// SvelteKit handler
app.use(handler);

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`🚀 Server listening on port ${port}`);
});
