import { EventEmitter } from 'events';
import * as crypto from 'crypto';

interface WebRTCConfig {
  iceServers: RTCIceServer[];
  enableVideo: boolean;
  enableAudio: boolean;
  enableScreenShare: boolean;
  enableChat: boolean;
  maxParticipants: number;
  encryptionKey: string;
  recordingEnabled: boolean;
}

interface Participant {
  id: string;
  userId: string;
  name: string;
  role: 'host' | 'moderator' | 'participant' | 'observer';
  stream?: MediaStream;
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
  joinedAt: Date;
  metadata: Record<string, any>;
}

interface Room {
  id: string;
  name: string;
  hostId: string;
  participants: Participant[];
  settings: {
    isLocked: boolean;
    allowScreenShare: boolean;
    allowRecording: boolean;
    maxDuration: number;
    password?: string;
  };
  createdAt: Date;
  scheduledEnd?: Date;
}

interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  content: string;
  type: 'text' | 'file' | 'system';
  timestamp: Date;
  encrypted: boolean;
  metadata?: {
    fileName?: string;
    fileSize?: number;
    fileType?: string;
  };
}

interface RecordingSession {
  id: string;
  roomId: string;
  startedAt: Date;
  endedAt?: Date;
  format: 'webm' | 'mp4' | 'audio-only';
  quality: 'low' | 'medium' | 'high';
  fileSize?: number;
  encryptedStorage: boolean;
}

interface CallMetrics {
  roomId: string;
  participantId: string;
  startTime: Date;
  endTime?: Date;
  duration: number;
  packetsLost: number;
  packetsReceived: number;
  bytesReceived: number;
  bytesSent: number;
  audioLevel: number;
  videoQuality: number;
  connectionQuality: 'poor' | 'fair' | 'good' | 'excellent';
  bandwidth: {
    upload: number;
    download: number;
  };
}

export class WebRTCService extends EventEmitter {
  private rooms = new Map<string, Room>();
  private peerConnections = new Map<string, RTCPeerConnection>();
  private streams = new Map<string, MediaStream>();
  private messages = new Map<string, ChatMessage[]>();
  private recordings = new Map<string, RecordingSession>();
  private metrics = new Map<string, CallMetrics[]>();
  private config: WebRTCConfig;

  constructor(config: Partial<WebRTCConfig> = {}) {
    super();

    this.config = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        {
          urls: 'turn:turn.server.com:3478',
          username: process.env.TURN_USERNAME!,
          credential: process.env.TURN_CREDENTIAL!,
          credentialType: 'password'
        }
      ],
      enableVideo: true,
      enableAudio: true,
      enableScreenShare: true,
      enableChat: true,
      maxParticipants: 50,
      encryptionKey: this.generateEncryptionKey(),
      recordingEnabled: false,
      ...config
    };

    this.setupSignalServer();
  }

  private generateEncryptionKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private setupSignalServer(): void {
    // Setup WebSocket signaling server for WebRTC
    this.on('signaling_message', this.handleSignalingMessage.bind(this));
  }

  async createRoom(
    hostId: string,
    roomName: string,
    settings: Partial<Room['settings']> = {}
  ): Promise<Room> {
    const roomId = this.generateRoomId();
    const room: Room = {
      id: roomId,
      name: roomName,
      hostId,
      participants: [],
      settings: {
        isLocked: false,
        allowScreenShare: true,
        allowRecording: false,
        maxDuration: 120, // 2 hours default
        ...settings
      },
      createdAt: new Date()
    };

    this.rooms.set(roomId, room);
    this.messages.set(roomId, []);
    this.emit('room_created', room);

    return room;
  }

  async joinRoom(
    roomId: string,
    userId: string,
    name: string,
    role: Participant['role'] = 'participant',
    password?: string
  ): Promise<{ room: Room; peerConnection: RTCPeerConnection }> {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    if (room.settings.isLocked && !this.isAuthorized(roomId, userId)) {
      if (room.settings.password !== password) {
        throw new Error('Invalid password for locked room');
      }
    }

    if (room.participants.length >= this.config.maxParticipants) {
      throw new Error('Room is full');
    }

    const participant: Participant = {
      id: this.generateParticipantId(),
      userId,
      name,
      role,
      isMuted: false,
      isVideoOff: false,
      isScreenSharing: false,
      joinedAt: new Date(),
      metadata: {}
    };

    // Check if user is already in room
    const existingParticipant = room.participants.find(p => p.userId === userId);
    if (existingParticipant) {
      throw new Error('User already in room');
    }

    room.participants.push(participant);

    // Create peer connection
    const peerConnection = this.createPeerConnection(roomId, participant.id);
    this.peerConnections.set(`${roomId}:${participant.id}`, peerConnection);

    this.emit('participant_joined', { room, participant });

    // Setup user media
    if (this.config.enableAudio || this.config.enableVideo) {
      try {
        const stream = await this.getUserMedia({
          audio: this.config.enableAudio,
          video: this.config.enableVideo
        });

        participant.stream = stream;
        this.streams.set(`${roomId}:${participant.id}`, stream);

        // Add tracks to peer connection
        stream.getTracks().forEach(track => {
          peerConnection.addTrack(track, stream);
        });

        this.emit('media_stream_ready', { participant, stream });
      } catch (error) {
        console.error('Error getting user media:', error);
        throw new Error('Failed to access camera/microphone');
      }
    }

    return { room, peerConnection };
  }

  private createPeerConnection(roomId: string, participantId: string): RTCPeerConnection {
    const peerConnection = new RTCPeerConnection({
      iceServers: this.config.iceServers,
      iceCandidatePoolSize: 10
    });

    // Setup peer connection event handlers
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.emit('ice_candidate', {
          roomId,
          participantId,
          candidate: event.candidate
        });
      }
    };

    peerConnection.ontrack = (event) => {
      this.emit('remote_track', {
        roomId,
        participantId,
        stream: event.streams[0]
      });
    };

    peerConnection.onconnectionstatechange = () => {
      this.updateMetrics(roomId, participantId, {
        connectionState: peerConnection.connectionState,
        iceConnectionState: peerConnection.iceConnectionState,
        iceGatheringState: peerConnection.iceGatheringState
      });
    };

    peerConnection.oniceconnectionstatechange = () => {
      if (peerConnection.iceConnectionState === 'failed' ||
          peerConnection.iceConnectionState === 'disconnected') {
        this.handleConnectionFailure(roomId, participantId);
      }
    };

    return peerConnection;
  }

  async createOffer(roomId: string, participantId: string): Promise<RTCSessionDescriptionInit> {
    const peerConnection = this.peerConnections.get(`${roomId}:${participantId}`);
    if (!peerConnection) {
      throw new Error('Peer connection not found');
    }

    const offer = await peerConnection.createOffer({
      offerToReceiveAudio: this.config.enableAudio,
      offerToReceiveVideo: this.config.enableVideo
    });

    await peerConnection.setLocalDescription(offer);
    return offer;
  }

  async createAnswer(
    roomId: string,
    participantId: string,
    offer: RTCSessionDescriptionInit
  ): Promise<RTCSessionDescriptionInit> {
    const peerConnection = this.peerConnections.get(`${roomId}:${participantId}`);
    if (!peerConnection) {
      throw new Error('Peer connection not found');
    }

    await peerConnection.setRemoteDescription(offer);
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    return answer;
  }

  async handleAnswer(
    roomId: string,
    participantId: string,
    answer: RTCSessionDescriptionInit
  ): Promise<void> {
    const peerConnection = this.peerConnections.get(`${roomId}:${participantId}`);
    if (!peerConnection) {
      throw new Error('Peer connection not found');
    }

    await peerConnection.setRemoteDescription(answer);
  }

  async addIceCandidate(
    roomId: string,
    participantId: string,
    candidate: RTCIceCandidateInit
  ): Promise<void> {
    const peerConnection = this.peerConnections.get(`${roomId}:${participantId}`);
    if (!peerConnection) {
      return; // Peer connection might not be ready yet
    }

    await peerConnection.addIceCandidate(candidate);
  }

  async toggleAudio(roomId: string, participantId: string): Promise<boolean> {
    const stream = this.streams.get(`${roomId}:${participantId}`);
    const room = this.rooms.get(roomId);

    if (!stream || !room) {
      throw new Error('Stream or room not found');
    }

    const participant = room.participants.find(p => p.id === participantId);
    if (!participant) {
      throw new Error('Participant not found');
    }

    const audioTrack = stream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      participant.isMuted = !audioTrack.enabled;

      this.emit('audio_toggled', {
        roomId,
        participantId,
        muted: participant.isMuted
      });

      return participant.isMuted;
    }

    return false;
  }

  async toggleVideo(roomId: string, participantId: string): Promise<boolean> {
    const stream = this.streams.get(`${roomId}:${participantId}`);
    const room = this.rooms.get(roomId);

    if (!stream || !room) {
      throw new Error('Stream or room not found');
    }

    const participant = room.participants.find(p => p.id === participantId);
    if (!participant) {
      throw new Error('Participant not found');
    }

    const videoTrack = stream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      participant.isVideoOff = !videoTrack.enabled;

      this.emit('video_toggled', {
        roomId,
        participantId,
        videoOff: participant.isVideoOff
      });

      return participant.isVideoOff;
    }

    return false;
  }

  async startScreenShare(roomId: string, participantId: string): Promise<MediaStream> {
    if (!this.config.enableScreenShare) {
      throw new Error('Screen sharing is not enabled');
    }

    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });

      const peerConnection = this.peerConnections.get(`${roomId}:${participantId}`);
      if (peerConnection) {
        // Replace video track with screen share
        const videoTrack = screenStream.getVideoTracks()[0];
        const sender = peerConnection.getSenders().find(s =>
          s.track && s.track.kind === 'video'
        );

        if (sender) {
          await sender.replaceTrack(videoTrack);
        } else {
          peerConnection.addTrack(videoTrack, screenStream);
        }
      }

      const room = this.rooms.get(roomId);
      if (room) {
        const participant = room.participants.find(p => p.id === participantId);
        if (participant) {
          participant.isScreenSharing = true;
        }
      }

      screenStream.getVideoTracks()[0].onended = () => {
        this.stopScreenShare(roomId, participantId);
      };

      this.emit('screen_share_started', { roomId, participantId, stream: screenStream });
      return screenStream;

    } catch (error) {
      console.error('Error starting screen share:', error);
      throw new Error('Failed to start screen sharing');
    }
  }

  async stopScreenShare(roomId: string, participantId: string): Promise<void> {
    const room = this.rooms.get(roomId);
    if (room) {
      const participant = room.participants.find(p => p.id === participantId);
      if (participant) {
        participant.isScreenSharing = false;
      }
    }

    this.emit('screen_share_stopped', { roomId, participantId });
  }

  async sendMessage(
    roomId: string,
    senderId: string,
    senderName: string,
    content: string,
    type: ChatMessage['type'] = 'text'
  ): Promise<ChatMessage> {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    const encryptedContent = this.encryptMessage(content);

    const message: ChatMessage = {
      id: this.generateMessageId(),
      roomId,
      senderId,
      senderName,
      content: encryptedContent,
      type,
      timestamp: new Date(),
      encrypted: true
    };

    const messages = this.messages.get(roomId) || [];
    messages.push(message);
    this.messages.set(roomId, messages);

    this.emit('message_sent', { roomId, message });
    return message;
  }

  async getMessages(roomId: string): Promise<ChatMessage[]> {
    const messages = this.messages.get(roomId) || [];
    return messages.map(msg => ({
      ...msg,
      content: this.decryptMessage(msg.content)
    }));
  }

  async startRecording(roomId: string, format: RecordingSession['format'] = 'webm'): Promise<RecordingSession> {
    if (!this.config.recordingEnabled) {
      throw new Error('Recording is not enabled');
    }

    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    if (!room.settings.allowRecording) {
      throw new Error('Recording is not allowed in this room');
    }

    const recording: RecordingSession = {
      id: this.generateRecordingId(),
      roomId,
      startedAt: new Date(),
      format,
      quality: 'medium',
      encryptedStorage: true
    };

    this.recordings.set(recording.id, recording);
    this.emit('recording_started', { roomId, recording });

    return recording;
  }

  async stopRecording(recordingId: string): Promise<RecordingSession> {
    const recording = this.recordings.get(recordingId);
    if (!recording) {
      throw new Error('Recording not found');
    }

    recording.endedAt = new Date();
    this.emit('recording_stopped', recording);

    return recording;
  }

  async leaveRoom(roomId: string, participantId: string): Promise<void> {
    const room = this.rooms.get(roomId);
    if (!room) {
      return;
    }

    // Remove participant from room
    room.participants = room.participants.filter(p => p.id !== participantId);

    // Clean up peer connection
    const peerConnection = this.peerConnections.get(`${roomId}:${participantId}`);
    if (peerConnection) {
      peerConnection.close();
      this.peerConnections.delete(`${roomId}:${participantId}`);
    }

    // Clean up stream
    const stream = this.streams.get(`${roomId}:${participantId}`);
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      this.streams.delete(`${roomId}:${participantId}`);
    }

    // Delete room if empty
    if (room.participants.length === 0) {
      this.deleteRoom(roomId);
    }

    this.emit('participant_left', { roomId, participantId });
  }

  private deleteRoom(roomId: string): void {
    this.rooms.delete(roomId);
    this.messages.delete(roomId);
    this.emit('room_deleted', { roomId });
  }

  private handleSignalingMessage(data: any): void {
    // Handle signaling messages from WebSocket server
    switch (data.type) {
      case 'offer':
        this.emit('offer_received', data);
        break;
      case 'answer':
        this.emit('answer_received', data);
        break;
      case 'ice-candidate':
        this.emit('ice_candidate_received', data);
        break;
      case 'join-room':
        this.emit('join_request', data);
        break;
      case 'leave-room':
        this.emit('leave_request', data);
        break;
    }
  }

  private handleConnectionFailure(roomId: string, participantId: string): void {
    this.emit('connection_failed', { roomId, participantId });

    // Attempt to reconnection
    setTimeout(() => {
      this.attemptReconnection(roomId, participantId);
    }, 5000);
  }

  private async attemptReconnection(roomId: string, participantId: string): Promise<void> {
    try {
      // Recreate peer connection
      const peerConnection = this.createPeerConnection(roomId, participantId);
      this.peerConnections.set(`${roomId}:${participantId}`, peerConnection);

      this.emit('reconnection_attempt', { roomId, participantId });
    } catch (error) {
      console.error('Reconnection failed:', error);
      this.emit('reconnection_failed', { roomId, participantId });
    }
  }

  private updateMetrics(roomId: string, participantId: string, data: any): void {
    const key = `${roomId}:${participantId}`;
    const existingMetrics = this.metrics.get(key) || [];

    const metrics: CallMetrics = {
      roomId,
      participantId,
      startTime: new Date(),
      duration: 0,
      packetsLost: 0,
      packetsReceived: 0,
      bytesReceived: 0,
      bytesSent: 0,
      audioLevel: 0,
      videoQuality: 0,
      connectionQuality: 'fair',
      bandwidth: { upload: 0, download: 0 },
      ...data
    };

    existingMetrics.push(metrics);
    this.metrics.set(key, existingMetrics);
  }

  private encryptMessage(content: string): string {
    const cipher = crypto.createCipher('aes-256-cbc', this.config.encryptionKey);
    let encrypted = cipher.update(content, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  private decryptMessage(encryptedContent: string): string {
    const decipher = crypto.createDecipher('aes-256-cbc', this.config.encryptionKey);
    let decrypted = decipher.update(encryptedContent, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  private getUserMedia(constraints: MediaStreamConstraints): Promise<MediaStream> {
    return navigator.mediaDevices.getUserMedia(constraints);
  }

  private isAuthorized(roomId: string, userId: string): boolean {
    // Check if user is host or moderator
    const room = this.rooms.get(roomId);
    if (!room) return false;

    return room.hostId === userId ||
           room.participants.some(p => p.userId === userId && p.role === 'moderator');
  }

  private generateRoomId(): string {
    return 'room_' + crypto.randomBytes(16).toString('hex');
  }

  private generateParticipantId(): string {
    return 'participant_' + crypto.randomBytes(8).toString('hex');
  }

  private generateMessageId(): string {
    return 'msg_' + crypto.randomBytes(16).toString('hex');
  }

  private generateRecordingId(): string {
    return 'rec_' + crypto.randomBytes(12).toString('hex');
  }

  // Public API methods
  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  getParticipant(roomId: string, participantId: string): Participant | undefined {
    const room = this.rooms.get(roomId);
    return room?.participants.find(p => p.id === participantId);
  }

  getMetrics(roomId: string, participantId?: string): CallMetrics[] {
    if (participantId) {
      return this.metrics.get(`${roomId}:${participantId}`) || [];
    }

    const allMetrics: CallMetrics[] = [];
    this.metrics.forEach((metrics) => {
      if (metrics[0]?.roomId === roomId) {
        allMetrics.push(...metrics);
      }
    });
    return allMetrics;
  }

  async setRoomSettings(roomId: string, settings: Partial<Room['settings']>): Promise<void> {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    Object.assign(room.settings, settings);
    this.emit('settings_updated', { roomId, settings });
  }

  async kickParticipant(roomId: string, participantId: string, reason?: string): Promise<void> {
    await this.leaveRoom(roomId, participantId);
    this.emit('participant_kicked', { roomId, participantId, reason });
  }

  async banParticipant(roomId: string, userId: string): Promise<void> {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    // Remove all sessions of the user
    const userParticipants = room.participants.filter(p => p.userId === userId);
    for (const participant of userParticipants) {
      await this.leaveRoom(roomId, participant.id);
    }

    // Add to ban list (implement as needed)
    this.emit('participant_banned', { roomId, userId });
  }

  destroy(): void {
    // Clean up all resources
    this.peerConnections.forEach(pc => pc.close());
    this.streams.forEach(stream => stream.getTracks().forEach(track => track.stop()));
    this.rooms.clear();
    this.peerConnections.clear();
    this.streams.clear();
    this.messages.clear();
    this.recordings.clear();
    this.metrics.clear();
  }
}