// @ts-nocheck - Temporarily disable TypeScript checks for browser compatibility
export class WebRTCClient {
    signallingServerUrl: string;
    signalling: WebSocket | null;
    peerConnections: Map<string, RTCPeerConnection>;
    localStream: MediaStream | null;
    roomId: string | null;
    clientId: string | null;
    isInitiator: boolean;

    // Event handlers
    onConnectionStateChange: ((state: string) => void) | null;
    onRemoteStream: ((peerId: string, stream: MediaStream) => void) | null;
    onPeerJoined: ((peerId: string) => void) | null;
    onPeerLeft: ((peerId: string) => void) | null;
    onMessage: ((message: any) => void) | null;

    // WebRTC configuration with STUN servers
    private configuration: RTCConfiguration;

    constructor(signalingServerUrl = 'ws://localhost:3002') {
        this.signalingServerUrl = signalingServerUrl || 'ws://localhost:3002';
        this.signaling = null;
        this.peerConnections = new Map();
        this.localStream = null;
        this.roomId = null;
        this.clientId = null;
        this.isInitiator = false;

        // Initialize event handlers
        this.onConnectionStateChange = null;
        this.onRemoteStream = null;
        this.onPeerJoined = null;
        this.onPeerLeft = null;
        this.onMessage = null;

        // WebRTC configuration with STUN servers
        this.configuration = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                // Add more STUN servers for better connectivity
                { urls: 'stun:stun2.l.google.com:19302' },
                { urls: 'stun:stun3.l.google.com:19302' },
                { urls: 'stun:stun4.l.google.com:19302' }
            ]
        };
    }

    async connect(): Promise<void> {
        if (this.signaling && this.signaling.readyState === WebSocket.OPEN) {
            return;
        }

        return new Promise((resolve, reject) => {
            try {
                this.signaling = new WebSocket(this.signalingServerUrl);

                this.signaling.onopen = () => {
                    console.log('🌐 Connected to WebRTC signaling server');
                    this.clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                    resolve();
                };

                this.signaling.onmessage = (event) => {
                    this.handleSignalingMessage(event.data);
                };

                this.signaling.onclose = () => {
                    console.log('🌐 Disconnected from WebRTC signaling server');
                    if (this.onConnectionStateChange) {
                        this.onConnectionStateChange('disconnected');
                    }
                };

                this.signaling.onerror = (error) => {
                    console.error('🌐 WebRTC signaling error:', error);
                    reject(error);
                };

            } catch (error) {
                reject(error);
            }
        });
    }

    async joinRoom(roomId: string): Promise<void> {
        if (!this.signaling || this.signaling.readyState !== WebSocket.OPEN) {
            throw new Error('Not connected to signaling server');
        }

        this.roomId = roomId;
        console.log(`🚪 Joining room: ${roomId}`);

        this.signaling.send(JSON.stringify({
            type: 'join-room',
            roomId: roomId,
            clientId: this.clientId
        }));

        if (this.onConnectionStateChange) {
            this.onConnectionStateChange('connecting');
        }
    }

    leaveRoom(): void {
        if (this.roomId && this.signaling && this.signaling.readyState === WebSocket.OPEN) {
            console.log(`🚪 Leaving room: ${this.roomId}`);

            this.signaling.send(JSON.stringify({
                type: 'leave-room',
                roomId: this.roomId
            }));

            // Close all peer connections
            for (const [peerId, pc] of this.peerConnections) {
                pc.close();
            }
            this.peerConnections.clear();

            this.roomId = null;

            if (this.onConnectionStateChange) {
                this.onConnectionStateChange('disconnected');
            }
        }
    }

    async startLocalStream(): Promise<void> {
        try {
            console.log('🎤🎥 Requesting local media access...');
            this.localStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    autoGainControl: true,
                    noiseSuppression: true,
                    sampleRate: 16000
                },
                video: false // Audio-only for language practice
            });

            console.log('✅ Local media access granted');
        } catch (error) {
            console.error('❌ Failed to access local media:', error);
            throw new Error(`Could not access microphone: ${(error as Error).message}`);
        }
    }

    stopLocalStream(): void {
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
            this.localStream = null;
            console.log('⏹️ Local media stopped');
        }
    }

    async call(peerId: string): Promise<void> {
        console.log(`📞 Initiating WebRTC call to peer: ${peerId}`);

        const peerConnection = this.createPeerConnection(peerId);
        this.isInitiator = true;

        // Add local stream to peer connection
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => {
                peerConnection.addTrack(track, this.localStream!);
            });
        }

        // Create and send offer
        try {
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);

            this.signaling!.send(JSON.stringify({
                type: 'offer',
                roomId: this.roomId,
                peerId: peerId,
                offer: offer
            }));

            console.log('📤 Offer sent to peer');
        } catch (error) {
            console.error('❌ Failed to create offer:', error);
            throw error;
        }
    }

    createPeerConnection(peerId: string): RTCPeerConnection {
        console.log(`🔗 Creating peer connection for: ${peerId}`);

        const peerConnection = new RTCPeerConnection(this.configuration);
        this.peerConnections.set(peerId, peerConnection);

        peerConnection.ontrack = (event) => {
            console.log(`📡 Received remote stream from: ${peerId}`, event.streams[0]);
            if (this.onRemoteStream && event.streams[0]) {
                this.onRemoteStream(peerId, event.streams[0]);
            }
        };

        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                console.log('🧊 ICE candidate:', event.candidate);
                this.signaling!.send(JSON.stringify({
                    type: 'ice-candidate',
                    roomId: this.roomId,
                    peerId: peerId,
                    candidate: event.candidate
                }));
            }
        };

        peerConnection.onconnectionstatechange = () => {
            console.log(`🔄 Connection state with ${peerId}:`, peerConnection.connectionState);
            if (peerConnection.connectionState === 'connected' && this.onConnectionStateChange) {
                this.onConnectionStateChange('connected');
            }
        };

        peerConnection.oniceconnectionstatechange = () => {
            console.log(`🧊 ICE connection state with ${peerId}:`, peerConnection.iceConnectionState);
        };

        return peerConnection;
    }

    async handleSignalingMessage(data: string): Promise<void> {
        try {
            const message = JSON.parse(data);

            switch (message.type) {
                case 'peer-joined':
                    console.log(`👋 Peer joined: ${message.clientId}`);
                    if (message.clientId !== this.clientId && this.onPeerJoined) {
                        this.onPeerJoined(message.clientId);
                    }
                    // If we're the first to join, we might need to wait for the other peer to initiate
                    break;

                case 'peer-left':
                    console.log(`👋 Peer left: ${message.clientId}`);
                    // Close peer connection if exists
                    const pc = this.peerConnections.get(message.clientId);
                    if (pc) {
                        pc.close();
                        this.peerConnections.delete(message.clientId);
                    }
                    if (this.onPeerLeft) {
                        this.onPeerLeft(message.clientId);
                    }
                    break;

                case 'offer':
                    console.log(`📥 Received offer from: ${message.peerId}`);
                    await this.handleOffer(message);
                    break;

                case 'answer':
                    console.log(`📥 Received answer from: ${message.peerId}`);
                    await this.handleAnswer(message);
                    break;

                case 'ice-candidate':
                    console.log(`🧊 Received ICE candidate from: ${message.peerId}`);
                    await this.handleIceCandidate(message);
                    break;

                default:
                    if (this.onMessage) {
                        this.onMessage(message);
                    }
            }
        } catch (error) {
            console.error('❌ Error handling signaling message:', error);
        }
    }

    async handleOffer(message: any): Promise<void> {
        const peerConnection = this.createPeerConnection(message.peerId);

        // Add local stream
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => {
                peerConnection.addTrack(track, this.localStream!);
            });
        }

        // Set remote description
        await peerConnection.setRemoteDescription(new RTCSessionDescription(message.offer));

        // Create and send answer
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);

        this.signaling!.send(JSON.stringify({
            type: 'answer',
            roomId: this.roomId,
            peerId: message.peerId,
            answer: answer
        }));

        console.log('📤 Answer sent');
    }

    async handleAnswer(message: any): Promise<void> {
        const peerConnection = this.peerConnections.get(message.peerId);
        if (peerConnection) {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(message.answer));
        }
    }

    async handleIceCandidate(message: any): Promise<void> {
        const peerConnection = this.peerConnections.get(message.peerId);
        if (peerConnection && message.candidate) {
            await peerConnection.addIceCandidate(new RTCIceCandidate(message.candidate));
        }
    }

    disconnect(): void {
        this.stopLocalStream();
        this.leaveRoom();

        if (this.signaling) {
            this.signaling.close();
            this.signaling = null;
        }

        console.log('🌐 WebRTC client disconnected');
    }
}
