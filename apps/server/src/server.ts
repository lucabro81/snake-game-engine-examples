import { WebSocket, WebSocketServer } from 'ws';
import { GameMessageType } from './utils/game-messages';
import { Room } from './room';
import { v4 as uuidv4 } from 'uuid';

export class GameServer {
  private wss: WebSocketServer;
  private connections: Map<WebSocket, string> = new Map();
  private rooms: Map<string, Room> = new Map();

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
        console.log('Client disconnected');
        this.connections.delete(ws);
      });
    });
  }

  private sendError(ws: WebSocket, code: string, message: string) {
    ws.send(JSON.stringify({
      type: GameMessageType.ERROR,
      data: { code, message }
    }));
  }

  private handleMessage(ws: WebSocket, message: any) {
    const { type, data } = message;

    switch (type) {
      case GameMessageType.CREATE_ROOM:
        // Temporary implementation for testing
        ws.send(JSON.stringify({
          type: GameMessageType.ROOM_CREATED,
          data: {
            roomId: 'test-room-1',
            playerId: 'player-1'
          }
        }));
        break;
      case GameMessageType.JOIN_ROOM:
        // Will implement in next step
        break;
      default:
        this.sendError(ws, 'UNKNOWN_MESSAGE', 'Unknown message type');
    }
  }

  private handlePlayerDisconnect(ws: WebSocket, playerId: string) {
    // Will implement in next step
  }

  close() {
    this.wss.close();
  }
}

// Only start the server if this file is run directly
if (require.main === module) {
  const server = new GameServer();
  console.log('WebSocket server is running on port 8080');
}