// import { WebSocketServer } from "ws";

// const wss = new WebSocketServer({ port: 8080 });

// wss.on("connection", function connection(ws) {
//   ws.on("error", console.error);

//   ws.on("message", function message(data) {
//     console.log("received: %s", data);
//     setTimeout(() => {
//       ws.send("response");
//     }, 1000);
//   });

//   ws.send("connected");
// });

import { WebSocket, WebSocketServer } from 'ws';
import { GameRoom, Snake, MessageSent, MessageSentType, MessageReceived, MessageReceivedType } from './types';

const rooms: Map<string, GameRoom> = new Map();

const wss = new WebSocketServer({ port: 8080 });

function randomId(): string {
  return Math.floor(Math.random() * 10 ** 16).toString(36);
}

function addPlayerToRoom(room: GameRoom, playerId: string, ws: WebSocket): { playerId: string, roomId: string } {
  room.players.set(playerId, ws);
  return { playerId, roomId: room.id };
}

function initializeGameStateForPlayer(playerId: string, room: GameRoom): GameRoom["gameState"] {
  // TODO: ranodomize the starting position and direction
  const snake = {
    positions: [{ x: 5, y: 5 }],
    direction: { x: 1, y: 0 }
  }
  room.gameState.snakes.set(playerId, snake);
  return room.gameState;
}

function updateGameStateForPlayer(playerId: string, room: GameRoom, snake: Snake): GameRoom["gameState"] {
  room.gameState.snakes.set(playerId, snake);
  return room.gameState;
}

function createRoom(playerId: string, ws: WebSocket): { room?: GameRoom, roomId: string } {
  const roomId = randomId();
  const room: GameRoom = {
    id: roomId,
    players: new Map(),
    gameState: {
      snakes: new Map(),
      food: null
    }
  }
  rooms.set(roomId, room);

  addPlayerToRoom(room, playerId, ws);
  const gameState = initializeGameStateForPlayer(playerId, room);

  ws.send(JSON.stringify({
    type: MessageSentType.ROOM_CREATED,
    roomId: roomId,
    playerId,
    gameState
  }));
  return { room, roomId };
}

function joinRoom(playerId: string, ws: WebSocket, roomId: string) {
  const roomToJoin = rooms.get(roomId);
  if (roomToJoin && roomToJoin.players.size < 2) {
    roomId;
    addPlayerToRoom(roomToJoin, playerId, ws);
    const gameState = initializeGameStateForPlayer(playerId, roomToJoin);

    const joinedRoomMessage: MessageSent = {
      type: MessageSentType.JOINED_ROOM,
      roomId: roomId,
      playerId,
      gameState
    }

    const playerJoinedMessage: MessageSent = {
      type: MessageSentType.PLAYER_JOINED,
      playerId
    }

    ws.send(JSON.stringify(joinedRoomMessage));
    broadcastToRoom(roomId, playerJoinedMessage, ws);

    if (roomToJoin.players.size === 2) {
      broadcastToRoom(roomId, {
        type: MessageSentType.GAME_START
      });
    }
  } else {
    ws.send(JSON.stringify({
      type: MessageSentType.ERROR,
      message: 'Room full or not found'
    }));
  }
}

function broadcastToRoom(roomId: string, message: any, exclude?: WebSocket) {
  const room = rooms.get(roomId);
  if (!room) return;

  room.players.forEach((player) => {
    if (player !== exclude && player.readyState === WebSocket.OPEN) {
      player.send(JSON.stringify(message));
    }
  });
}

wss.on('connection', (ws) => {
  const playerId = randomId();
  let currentRoomId: string | null = null;

  ws.on('message', (data) => {
    try {
      const { type, roomId, snake, food }: MessageReceived = JSON.parse(data.toString());

      switch (type) {
        case MessageReceivedType.CREATE_ROOM:
          createRoom(playerId, ws);
          break;

        case MessageReceivedType.JOIN_ROOM:
          joinRoom(playerId, ws, roomId);
          break;

        case MessageReceivedType.UPDATE_SNAKE:
          if (currentRoomId) {
            const room = rooms.get(currentRoomId);
            if (room) {
              updateGameStateForPlayer(playerId, room, snake);
              broadcastToRoom(currentRoomId, {
                type: MessageSentType.SNAKE_UPDATED,
                playerId,
                snake
              }, ws);
            }
          }
          break;

        case MessageReceivedType.UPDATE_FOOD:
          if (currentRoomId) {
            const room = rooms.get(currentRoomId);
            if (room) {
              room.gameState.food = food;
              broadcastToRoom(currentRoomId, {
                type: MessageSentType.FOOD_UPDATED,
                food
              });
            }
          }
          break;
      }
    } catch (err) {
      console.error('Error processing message:', err);
    }
  });

  ws.on('close', () => {
    if (currentRoomId) {
      const room = rooms.get(currentRoomId);
      if (room) {
        room.players.delete(playerId);
        room.gameState.snakes.delete(playerId);

        broadcastToRoom(currentRoomId, {
          type: MessageSentType.PLAYER_LEFT,
          playerId
        });

        if (room.players.size === 0) {
          rooms.delete(currentRoomId);
        }
      }
    }
  });
});