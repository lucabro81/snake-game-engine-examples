import { WebSocket, WebSocketServer } from 'ws';
import { GameMessageType } from './utils/game-messages';
import { Room } from './room';
import { RoomStatus } from './utils/room-status';
import { SnakeMessageType } from './utils/snake-messages';

export class GameServer {
  private wss: WebSocketServer;
  private connections: Map<WebSocket, string> = new Map(); // ws -> playerId
  private rooms: Map<string, Room> = new Map(); // roomId -> Room
  private playerRooms: Map<string, string> = new Map(); // playerId -> roomId

  constructor(port: number = 8080) {
    this.wss = new WebSocketServer({ port });
    this.setupWebSocketServer();
  }

  private setupWebSocketServer() {
    this.wss.on('connection', (ws: WebSocket) => {
      console.log('New client connected');

      ws.on('message', (message: string) => {
        try {
          const parsedMessage = JSON.parse(message.toString());
          this.handleMessage(ws, parsedMessage);
        } catch (error) {
          console.error('Error parsing message:', error);
          this.sendError(ws, 'INVALID_MESSAGE', 'Invalid message format');
        }
      });

      ws.on('close', () => {
        const playerId = this.connections.get(ws);
        if (playerId) {
          this.handlePlayerDisconnect(ws, playerId);
        }
        this.connections.delete(ws);
        console.log('Client disconnected');
      });
    });
  }

  private handleMessage(ws: WebSocket, message: any) {
    const { type, data } = message;

    switch (type) {
      case GameMessageType.CREATE_ROOM:
        this.handleCreateRoom(ws);
        break;
      case GameMessageType.JOIN_ROOM:
        this.handleJoinRoom(ws, data);
        break;
      // Forward game-related messages to room members
      case SnakeMessageType.PLAYER_POSITION_UPDATE:
      case SnakeMessageType.FOOD_COLLECTED:
      case SnakeMessageType.PLAYER_DIED:
        this.relayMessageToRoom(ws, message);
        break;
      default:
        this.sendError(ws, 'UNKNOWN_MESSAGE', 'Unknown message type');
    }
  }

  private handleCreateRoom(ws: WebSocket) {
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase(); // Simple room code
    const playerId = Math.random().toString(36).substring(2, 10); // Simple player id

    const room = new Room(roomId);
    this.rooms.set(roomId, room);

    if (!room.addPlayer(playerId, ws)) {
      this.rooms.delete(roomId);
      return this.sendError(ws, 'ROOM_ERROR', 'Could not create room');
    }

    this.connections.set(ws, playerId);
    this.playerRooms.set(playerId, roomId);

    ws.send(JSON.stringify({
      type: GameMessageType.ROOM_CREATED,
      data: {
        roomId,
        playerId
      }
    }));
  }

  private handleJoinRoom(ws: WebSocket, data: { roomId: string }) {
    const { roomId } = data;
    const room = this.rooms.get(roomId);

    if (!room) {
      return this.sendError(ws, 'ROOM_NOT_FOUND', 'Room not found');
    }

    const playerId = Math.random().toString(36).substring(2, 10);

    if (!room.addPlayer(playerId, ws)) {
      return this.sendError(ws, 'ROOM_FULL', 'Room is full');
    }

    this.connections.set(ws, playerId);
    this.playerRooms.set(playerId, roomId);

    // Notify others in the room
    room.broadcast({
      type: GameMessageType.PLAYER_JOINED,
      data: { playerId }
    }, playerId); // Exclude the new player from this broadcast

    // Send join confirmation to the new player
    ws.send(JSON.stringify({
      type: GameMessageType.ROOM_JOINED,
      data: {
        roomId,
        playerId
      }
    }));

    // If room is ready to start, notify everyone
    if (room.getStatus() === RoomStatus.READY) {
      room.broadcast({
        type: GameMessageType.GAME_CAN_START,
        data: { roomId }
      });
    }
  }

  private relayMessageToRoom(ws: WebSocket, message: any) {
    const playerId = this.connections.get(ws);
    if (!playerId) return;

    const roomId = this.playerRooms.get(playerId);
    if (!roomId) return;

    const room = this.rooms.get(roomId);
    if (!room) return;

    // Relay the message to all other players in the room
    room.broadcast(message, playerId);
  }

  private handlePlayerDisconnect(ws: WebSocket, playerId: string) {
    const roomId = this.playerRooms.get(playerId);
    if (!roomId) return;

    const room = this.rooms.get(roomId);
    if (!room) return;

    room.removePlayer(playerId);
    this.playerRooms.delete(playerId);

    // Notify others in the room
    room.broadcast({
      type: GameMessageType.PLAYER_LEFT,
      data: { playerId }
    });

    // If room is empty, remove it
    if (room.getPlayerCount() === 0) {
      this.rooms.delete(roomId);
    }
  }

  private sendError(ws: WebSocket, code: string, message: string) {
    ws.send(JSON.stringify({
      type: GameMessageType.ERROR,
      data: { code, message }
    }));
  }

  close() {
    this.wss.close();
  }
}