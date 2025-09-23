import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class WebRTCSignalingServer {
    constructor(port = 3002) {
        this.port = port;
        this.rooms = new Map(); // roomId -> Set of WebSocket connections
        this.server = createServer();
        this.wss = new WebSocketServer({ server: this.server });

        this.setupWebSocketHandlers();
        console.log(`WebRTC Signaling Server initializing on port ${port}`);
    }

    setupWebSocketHandlers() {
        this.wss.on('connection', (ws, request) => {
            const clientId = this.generateClientId();
            console.log(`WebRTC client connected: ${clientId}`);

            ws.clientId = clientId;
            ws.isAlive = true;

            ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data.toString());
                    this.handleMessage(ws, message);
                } catch (error) {
                    console.error('Invalid message format:', error);
                }
            });

            ws.on('close', () => {
                console.log(`WebRTC client disconnected: ${clientId}`);
                this.removeFromAllRooms(ws);
            });

            ws.on('error', (error) => {
                console.error(`WebRTC client ${clientId} error:`, error);
                this.removeFromAllRooms(ws);
            });

            ws.on('pong', () => {
                ws.isAlive = true;
            });
        });

        // Heartbeat check
        setInterval(() => {
            this.wss.clients.forEach((ws) => {
                if (!ws.isAlive) {
                    console.log('Terminating dead connection');
                    return ws.terminate();
                }
                ws.isAlive = false;
                ws.ping();
            });
        }, 30000);
    }

    generateClientId() {
        return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    handleMessage(ws, message) {
        const { type, roomId, ...data } = message;

        switch (type) {
            case 'join-room':
                this.joinRoom(ws, roomId);
                break;

            case 'leave-room':
                this.leaveRoom(ws, roomId);
                break;

            case 'offer':
            case 'answer':
            case 'ice-candidate':
                this.broadcastToRoom(ws, roomId, message);
                break;

            default:
                console.log(`Unknown WebRTC message type: ${type}`);
        }
    }

    joinRoom(ws, roomId) {
        if (!this.rooms.has(roomId)) {
            this.rooms.set(roomId, new Set());
        }

        const room = this.rooms.get(roomId);
        room.add(ws);
        ws.currentRoom = roomId;

        console.log(`Client ${ws.clientId} joined room ${roomId}`);
        console.log(`Room ${roomId} now has ${room.size} participants`);

        // Notify others in the room
        const joinMessage = {
            type: 'peer-joined',
            clientId: ws.clientId,
            roomId: roomId
        };

        this.broadcastToRoom(ws, roomId, joinMessage, true); // Exclude sender
    }

    leaveRoom(ws, roomId) {
        const room = this.rooms.get(roomId);
        if (room) {
            room.delete(ws);

            if (room.size === 0) {
                this.rooms.delete(roomId);
                console.log(`Room ${roomId} deleted (empty)`);
            } else {
                console.log(`Client ${ws.clientId} left room ${roomId}`);
                console.log(`Room ${roomId} now has ${room.size} participants`);

                // Notify others in the room
                const leaveMessage = {
                    type: 'peer-left',
                    clientId: ws.clientId,
                    roomId: roomId
                };

                this.broadcastToRoom(ws, roomId, leaveMessage, true); // Exclude sender
            }
        }

        if (ws.currentRoom === roomId) {
            delete ws.currentRoom;
        }
    }

    broadcastToRoom(sender, roomId, message, excludeSender = false) {
        const room = this.rooms.get(roomId);
        if (!room) return;

        const messageStr = JSON.stringify(message);

        for (const client of room) {
            if (excludeSender && client === sender) continue;

            if (client.readyState === client.OPEN) {
                client.send(messageStr);
            }
        }
    }

    removeFromAllRooms(ws) {
        // Remove from current room if any
        if (ws.currentRoom) {
            this.leaveRoom(ws, ws.currentRoom);
        }

        // Also check all rooms in case of multiple room membership
        for (const [roomId, room] of this.rooms) {
            if (room.has(ws)) {
                room.delete(ws);
                if (room.size === 0) {
                    this.rooms.delete(roomId);
                }
            }
        }
    }

    start() {
        return new Promise((resolve, reject) => {
            this.server.listen(this.port, (error) => {
                if (error) {
                    reject(error);
                } else {
                    console.log(`🚀 WebRTC Signaling Server running on port ${this.port}`);
                    resolve();
                }
            });
        });
    }

    stop() {
        this.server.close();
        console.log('WebRTC Signaling Server stopped');
    }
}

// Export for use in other files
export { WebRTCSignalingServer };

// If run directly, start the server
if (import.meta.url === `file://${process.argv[1]}`) {
    console.log('Starting WebRTC Signaling Server...');
    const server = new WebRTCSignalingServer();

    server.start()
        .then(() => console.log('WebRTC Signaling Server started successfully'))
        .catch((err) => {
            console.error('Failed to start WebRTC server:', err);
            process.exit(1);
        });

    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log('Shutting down WebRTC server...');
        server.stop();
        process.exit(0);
    });

    process.on('SIGTERM', () => {
        console.log('Shutting down WebRTC server...');
        server.stop();
        process.exit(0);
    });
} else {
    console.log('WebRTC server module loaded, not starting automatically');
}
