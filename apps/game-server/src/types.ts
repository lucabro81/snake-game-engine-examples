import { WebSocket } from "ws";

export interface GameRoom {
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

export enum MessageReceivedType {
  CREATE_ROOM = 'create_room',
  JOIN_ROOM = 'join_room',
  UPDATE_SNAKE = 'update_snake',
  UPDATE_FOOD = 'update_food'
}

export enum MessageSentType {
  ROOM_CREATED = 'room_created',
  JOINED_ROOM = 'joined_room',
  PLAYER_JOINED = 'player_joined',
  SNAKE_UPDATED = 'snake_updated',
  FOOD_UPDATED = 'food_updated',
  GAME_START = 'game_start',
  ERROR = 'error',
  PLAYER_LEFT = 'player_left'
}

export interface MessageReceived {
  type: MessageReceivedType;
  roomId: string;
  snake?: any;
  food?: any;
}

export interface MessageSent {
  type: MessageSentType;
  roomId?: string;
  playerId?: string;
  gameState?: any;
}

export interface Snake {
  positions: Array<{ x: number, y: number }>;
  direction: { x: number, y: number };
}