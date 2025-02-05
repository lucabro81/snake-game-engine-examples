import { WebSocket, WebSocketServer } from 'ws';
import { GameMessageType } from './types/game-messages';
import { SnakeMessageType } from './types/snake-messages';

const wss = new WebSocketServer({ port: 8080 });

// Track active connections
const connections = new Map<WebSocket, string>(); // WebSocket -> playerId

wss.on('connection', (ws: WebSocket) => {
  console.log('New client connected');

  ws.on('message', (message: string) => {
    try {
      const parsedMessage = JSON.parse(message.toString());
      handleMessage(ws, parsedMessage);
    } catch (error) {
      console.error('Error parsing message:', error);
      sendError(ws, 'INVALID_MESSAGE', 'Invalid message format');
    }
  });

  ws.on('close', () => {
    const playerId = connections.get(ws);
    if (playerId) {
      handlePlayerDisconnect(ws, playerId);
    }
    connections.delete(ws);
    console.log('Client disconnected');
  });
});

function sendError(ws: WebSocket, code: string, message: string) {
  ws.send(JSON.stringify({
    type: GameMessageType.ERROR,
    data: { code, message }
  }));
}

function handleMessage(ws: WebSocket, message: any) {
  const { type, data } = message;

  switch (type) {
    case GameMessageType.CREATE_ROOM:
      // pass
      break;
    case GameMessageType.JOIN_ROOM:
      // pass
      break;
    default:
      sendError(ws, 'UNKNOWN_MESSAGE', 'Unknown message type');
  }
}

function handlePlayerDisconnect(ws: WebSocket, playerId: string) {
  // pass
}

console.log('WebSocket server is running on port 8080');