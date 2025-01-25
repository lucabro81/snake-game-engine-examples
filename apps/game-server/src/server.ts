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

interface GameRoom {
  id: string;
  players: Map<string, WebSocket>;
  gameState: {
    snakes: Map<string, {
      positions: Array<{ x: number, y: number }>;
      direction: { x: number, y: number };
    }>;
    food: { x: number, y: number } | null;
  };
}

type MessageType = 'create_room' | 'join_room' | 'update_snake' | 'update_food';
interface Message {
  type: MessageType;
  roomId: string;
  snake?: any;
  food?: any;
}

interface Snake {
  positions: Array<{ x: number, y: number }>;
  direction: { x: number, y: number };
}

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

function createRoom(): { room?: GameRoom, roomId: string } {
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
  return { room, roomId };
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
      const { type, roomId, snake, food }: Message = JSON.parse(data.toString());

      switch (type) {
        case 'create_room':
          const { roomId: newRoomId, room } = createRoom();
          if (room) {
            addPlayerToRoom(room, playerId, ws);
            currentRoomId = newRoomId;
          }
          ws.send(JSON.stringify({
            type: 'room_created',
            roomId: currentRoomId,
            playerId
          }));
          break;

        case 'join_room':
          const roomToJoin = rooms.get(roomId);
          if (roomToJoin && roomToJoin.players.size < 2) {
            currentRoomId = roomId;
            addPlayerToRoom(roomToJoin, playerId, ws);
            const gameState = initializeGameStateForPlayer(playerId, roomToJoin);

            ws.send(JSON.stringify({
              type: 'joined_room',
              roomId: currentRoomId,
              playerId,
              gameState: gameState
            }));

            broadcastToRoom(currentRoomId, {
              type: 'player_joined',
              playerId
            }, ws);

            if (roomToJoin.players.size === 2) {
              broadcastToRoom(currentRoomId, {
                type: 'game_start'
              });
            }
          } else {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Room full or not found'
            }));
          }
          break;

        case 'update_snake':
          if (currentRoomId) {
            const room = rooms.get(currentRoomId);
            if (room) {
              updateGameStateForPlayer(playerId, room, snake);
              broadcastToRoom(currentRoomId, {
                type: 'snake_updated',
                playerId,
                snake
              }, ws);
            }
          }
          break;

        case 'update_food':
          if (currentRoomId) {
            const room = rooms.get(currentRoomId);
            if (room) {
              room.gameState.food = food;
              broadcastToRoom(currentRoomId, {
                type: 'food_updated',
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
          type: 'player_left',
          playerId
        });

        if (room.players.size === 0) {
          rooms.delete(currentRoomId);
        }
      }
    }
  });
});