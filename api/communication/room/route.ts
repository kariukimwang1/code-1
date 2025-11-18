import { NextRequest, NextResponse } from 'next/server';
import { WebRTCService } from '../../../lib/communication/webrtc-service';
import { verifyJwt } from '../../../lib/auth';
import { rateLimit } from '../../../lib/security/rate-limiter';

const webrtcService = new WebRTCService();

// Apply rate limiting
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later.' }
});

async function verifyRequest(request: NextRequest): Promise<{ userId: string; valid: boolean }> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { userId: '', valid: false };
    }

    const token = authHeader.substring(7);
    const decoded = verifyJwt(token);

    return {
      userId: decoded.userId,
      valid: true
    };
  } catch (error) {
    return { userId: '', valid: false };
  }
}

export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResult = await rateLimiter(request);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429 }
    );
  }

  try {
    const authResult = await verifyRequest(request);
    if (!authResult.valid) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { action, roomId, ...data } = await request.json();

    switch (action) {
      case 'create_room':
        return await handleCreateRoom(authResult.userId, data);

      case 'join_room':
        return await handleJoinRoom(authResult.userId, roomId, data);

      case 'leave_room':
        return await handleLeaveRoom(authResult.userId, roomId, data);

      case 'create_offer':
        return await handleCreateOffer(authResult.userId, roomId, data);

      case 'create_answer':
        return await handleCreateAnswer(authResult.userId, roomId, data);

      case 'handle_answer':
        return await handleAnswer(authResult.userId, roomId, data);

      case 'add_ice_candidate':
        return await handleIceCandidate(authResult.userId, roomId, data);

      case 'toggle_audio':
        return await handleToggleAudio(authResult.userId, roomId, data);

      case 'toggle_video':
        return await handleToggleVideo(authResult.userId, roomId, data);

      case 'start_screen_share':
        return await handleStartScreenShare(authResult.userId, roomId, data);

      case 'stop_screen_share':
        return await handleStopScreenShare(authResult.userId, roomId, data);

      case 'send_message':
        return await handleSendMessage(authResult.userId, roomId, data);

      case 'start_recording':
        return await handleStartRecording(authResult.userId, roomId, data);

      case 'stop_recording':
        return await handleStopRecording(authResult.userId, roomId, data);

      case 'kick_participant':
        return await handleKickParticipant(authResult.userId, roomId, data);

      case 'ban_participant':
        return await handleBanParticipant(authResult.userId, roomId, data);

      case 'update_settings':
        return await handleUpdateSettings(authResult.userId, roomId, data);

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('WebRTC API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyRequest(request);
    if (!authResult.valid) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('roomId');
    const action = searchParams.get('action');

    switch (action) {
      case 'get_room':
        if (!roomId) {
          return NextResponse.json(
            { error: 'Room ID is required' },
            { status: 400 }
          );
        }
        return await handleGetRoom(authResult.userId, roomId);

      case 'get_messages':
        if (!roomId) {
          return NextResponse.json(
            { error: 'Room ID is required' },
            { status: 400 }
          );
        }
        return await handleGetMessages(authResult.userId, roomId);

      case 'get_metrics':
        if (!roomId) {
          return NextResponse.json(
            { error: 'Room ID is required' },
            { status: 400 }
          );
        }
        return await handleGetMetrics(authResult.userId, roomId);

      case 'list_rooms':
        return await handleListRooms(authResult.userId);

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('WebRTC GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Action handlers
async function handleCreateRoom(userId: string, data: any) {
  try {
    const { roomName, settings } = data;

    if (!roomName) {
      return NextResponse.json(
        { error: 'Room name is required' },
        { status: 400 }
      );
    }

    const room = await webrtcService.createRoom(userId, roomName, settings);

    return NextResponse.json({
      success: true,
      data: { room }
    });

  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create room' },
      { status: 500 }
    );
  }
}

async function handleJoinRoom(userId: string, roomId: string, data: any) {
  try {
    const { name, role, password } = data;

    if (!name || !roomId) {
      return NextResponse.json(
        { error: 'Name and room ID are required' },
        { status: 400 }
      );
    }

    const result = await webrtcService.joinRoom(roomId, userId, name, role, password);

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to join room' },
      { status: 500 }
    );
  }
}

async function handleLeaveRoom(userId: string, roomId: string, data: any) {
  try {
    const { participantId } = data;

    if (!roomId || !participantId) {
      return NextResponse.json(
        { error: 'Room ID and participant ID are required' },
        { status: 400 }
      );
    }

    // Verify user owns this participant or is moderator/host
    const room = webrtcService.getRoom(roomId);
    const participant = webrtcService.getParticipant(roomId, participantId);

    if (!room || !participant) {
      return NextResponse.json(
        { error: 'Room or participant not found' },
        { status: 404 }
      );
    }

    if (participant.userId !== userId &&
        room.hostId !== userId &&
        participant.role !== 'moderator') {
      return NextResponse.json(
        { error: 'Unauthorized to remove this participant' },
        { status: 403 }
      );
    }

    await webrtcService.leaveRoom(roomId, participantId);

    return NextResponse.json({
      success: true,
      message: 'Left room successfully'
    });

  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to leave room' },
      { status: 500 }
    );
  }
}

async function handleCreateOffer(userId: string, roomId: string, data: any) {
  try {
    const { participantId } = data;

    if (!roomId || !participantId) {
      return NextResponse.json(
        { error: 'Room ID and participant ID are required' },
        { status: 400 }
      );
    }

    // Verify authorization
    const participant = webrtcService.getParticipant(roomId, participantId);
    if (!participant || participant.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const offer = await webrtcService.createOffer(roomId, participantId);

    return NextResponse.json({
      success: true,
      data: { offer }
    });

  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create offer' },
      { status: 500 }
    );
  }
}

async function handleCreateAnswer(userId: string, roomId: string, data: any) {
  try {
    const { participantId, offer } = data;

    if (!roomId || !participantId || !offer) {
      return NextResponse.json(
        { error: 'Room ID, participant ID, and offer are required' },
        { status: 400 }
      );
    }

    // Verify authorization
    const participant = webrtcService.getParticipant(roomId, participantId);
    if (!participant || participant.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const answer = await webrtcService.createAnswer(roomId, participantId, offer);

    return NextResponse.json({
      success: true,
      data: { answer }
    });

  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create answer' },
      { status: 500 }
    );
  }
}

async function handleAnswer(userId: string, roomId: string, data: any) {
  try {
    const { participantId, answer } = data;

    if (!roomId || !participantId || !answer) {
      return NextResponse.json(
        { error: 'Room ID, participant ID, and answer are required' },
        { status: 400 }
      );
    }

    // Verify authorization
    const participant = webrtcService.getParticipant(roomId, participantId);
    if (!participant || participant.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    await webrtcService.handleAnswer(roomId, participantId, answer);

    return NextResponse.json({
      success: true,
      message: 'Answer handled successfully'
    });

  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to handle answer' },
      { status: 500 }
    );
  }
}

async function handleIceCandidate(userId: string, roomId: string, data: any) {
  try {
    const { participantId, candidate } = data;

    if (!roomId || !participantId || !candidate) {
      return NextResponse.json(
        { error: 'Room ID, participant ID, and candidate are required' },
        { status: 400 }
      );
    }

    await webrtcService.addIceCandidate(roomId, participantId, candidate);

    return NextResponse.json({
      success: true,
      message: 'ICE candidate added successfully'
    });

  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to add ICE candidate' },
      { status: 500 }
    );
  }
}

async function handleToggleAudio(userId: string, roomId: string, data: any) {
  try {
    const { participantId } = data;

    if (!roomId || !participantId) {
      return NextResponse.json(
        { error: 'Room ID and participant ID are required' },
        { status: 400 }
      );
    }

    const participant = webrtcService.getParticipant(roomId, participantId);
    if (!participant || participant.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const isMuted = await webrtcService.toggleAudio(roomId, participantId);

    return NextResponse.json({
      success: true,
      data: { isMuted }
    });

  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to toggle audio' },
      { status: 500 }
    );
  }
}

async function handleToggleVideo(userId: string, roomId: string, data: any) {
  try {
    const { participantId } = data;

    if (!roomId || !participantId) {
      return NextResponse.json(
        { error: 'Room ID and participant ID are required' },
        { status: 400 }
      );
    }

    const participant = webrtcService.getParticipant(roomId, participantId);
    if (!participant || participant.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const isVideoOff = await webrtcService.toggleVideo(roomId, participantId);

    return NextResponse.json({
      success: true,
      data: { isVideoOff }
    });

  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to toggle video' },
      { status: 500 }
    );
  }
}

async function handleStartScreenShare(userId: string, roomId: string, data: any) {
  try {
    const { participantId } = data;

    if (!roomId || !participantId) {
      return NextResponse.json(
        { error: 'Room ID and participant ID are required' },
        { status: 400 }
      );
    }

    const participant = webrtcService.getParticipant(roomId, participantId);
    if (!participant || participant.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const stream = await webrtcService.startScreenShare(roomId, participantId);

    return NextResponse.json({
      success: true,
      data: { streamId: stream.id }
    });

  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to start screen share' },
      { status: 500 }
    );
  }
}

async function handleStopScreenShare(userId: string, roomId: string, data: any) {
  try {
    const { participantId } = data;

    if (!roomId || !participantId) {
      return NextResponse.json(
        { error: 'Room ID and participant ID are required' },
        { status: 400 }
      );
    }

    const participant = webrtcService.getParticipant(roomId, participantId);
    if (!participant || participant.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    await webrtcService.stopScreenShare(roomId, participantId);

    return NextResponse.json({
      success: true,
      message: 'Screen share stopped successfully'
    });

  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to stop screen share' },
      { status: 500 }
    );
  }
}

async function handleSendMessage(userId: string, roomId: string, data: any) {
  try {
    const { content, type, senderName } = data;

    if (!roomId || !content || !senderName) {
      return NextResponse.json(
        { error: 'Room ID, content, and sender name are required' },
        { status: 400 }
      );
    }

    const message = await webrtcService.sendMessage(
      roomId,
      userId,
      senderName,
      content,
      type
    );

    return NextResponse.json({
      success: true,
      data: { message }
    });

  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send message' },
      { status: 500 }
    );
  }
}

async function handleStartRecording(userId: string, roomId: string, data: any) {
  try {
    // Verify user is host or moderator
    const room = webrtcService.getRoom(roomId);
    if (!room || (room.hostId !== userId)) {
      return NextResponse.json(
        { error: 'Only hosts can start recordings' },
        { status: 403 }
      );
    }

    const { format } = data;
    const recording = await webrtcService.startRecording(roomId, format);

    return NextResponse.json({
      success: true,
      data: { recording }
    });

  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to start recording' },
      { status: 500 }
    );
  }
}

async function handleStopRecording(userId: string, roomId: string, data: any) {
  try {
    // Verify user is host or moderator
    const room = webrtcService.getRoom(roomId);
    if (!room || (room.hostId !== userId)) {
      return NextResponse.json(
        { error: 'Only hosts can stop recordings' },
        { status: 403 }
      );
    }

    const { recordingId } = data;
    if (!recordingId) {
      return NextResponse.json(
        { error: 'Recording ID is required' },
        { status: 400 }
      );
    }

    const recording = await webrtcService.stopRecording(recordingId);

    return NextResponse.json({
      success: true,
      data: { recording }
    });

  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to stop recording' },
      { status: 500 }
    );
  }
}

async function handleKickParticipant(userId: string, roomId: string, data: any) {
  try {
    const room = webrtcService.getRoom(roomId);
    if (!room || (room.hostId !== userId)) {
      return NextResponse.json(
        { error: 'Only hosts can kick participants' },
        { status: 403 }
      );
    }

    const { participantId, reason } = data;
    if (!participantId) {
      return NextResponse.json(
        { error: 'Participant ID is required' },
        { status: 400 }
      );
    }

    await webrtcService.kickParticipant(roomId, participantId, reason);

    return NextResponse.json({
      success: true,
      message: 'Participant kicked successfully'
    });

  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to kick participant' },
      { status: 500 }
    );
  }
}

async function handleBanParticipant(userId: string, roomId: string, data: any) {
  try {
    const room = webrtcService.getRoom(roomId);
    if (!room || (room.hostId !== userId)) {
      return NextResponse.json(
        { error: 'Only hosts can ban participants' },
        { status: 403 }
      );
    }

    const { targetUserId } = data;
    if (!targetUserId) {
      return NextResponse.json(
        { error: 'Target user ID is required' },
        { status: 400 }
      );
    }

    await webrtcService.banParticipant(roomId, targetUserId);

    return NextResponse.json({
      success: true,
      message: 'Participant banned successfully'
    });

  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to ban participant' },
      { status: 500 }
    );
  }
}

async function handleUpdateSettings(userId: string, roomId: string, data: any) {
  try {
    const room = webrtcService.getRoom(roomId);
    if (!room || (room.hostId !== userId)) {
      return NextResponse.json(
        { error: 'Only hosts can update settings' },
        { status: 403 }
      );
    }

    const { settings } = data;
    if (!settings) {
      return NextResponse.json(
        { error: 'Settings are required' },
        { status: 400 }
      );
    }

    await webrtcService.setRoomSettings(roomId, settings);

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully'
    });

  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update settings' },
      { status: 500 }
    );
  }
}

// GET handlers
async function handleGetRoom(userId: string, roomId: string) {
  try {
    const room = webrtcService.getRoom(roomId);
    if (!room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      );
    }

    // Filter sensitive information based on user role
    const participant = room.participants.find(p => p.userId === userId);
    if (!participant) {
      return NextResponse.json(
        { error: 'Not authorized to view this room' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { room }
    });

  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get room' },
      { status: 500 }
    );
  }
}

async function handleGetMessages(userId: string, roomId: string) {
  try {
    const room = webrtcService.getRoom(roomId);
    if (!room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      );
    }

    const participant = room.participants.find(p => p.userId === userId);
    if (!participant) {
      return NextResponse.json(
        { error: 'Not authorized to view messages' },
        { status: 403 }
      );
    }

    const messages = await webrtcService.getMessages(roomId);

    return NextResponse.json({
      success: true,
      data: { messages }
    });

  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get messages' },
      { status: 500 }
    );
  }
}

async function handleGetMetrics(userId: string, roomId: string) {
  try {
    const room = webrtcService.getRoom(roomId);
    if (!room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      );
    }

    // Only hosts and moderators can view metrics
    const participant = room.participants.find(p => p.userId === userId);
    if (!participant || (participant.role !== 'host' && participant.role !== 'moderator')) {
      return NextResponse.json(
        { error: 'Not authorized to view metrics' },
        { status: 403 }
      );
    }

    const metrics = webrtcService.getMetrics(roomId);

    return NextResponse.json({
      success: true,
      data: { metrics }
    });

  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get metrics' },
      { status: 500 }
    );
  }
}

async function handleListRooms(userId: string) {
  try {
    // In a real implementation, you'd get rooms from a database
    // For now, return empty list as we don't expose all rooms
    return NextResponse.json({
      success: true,
      data: { rooms: [] }
    });

  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to list rooms' },
      { status: 500 }
    );
  }
}