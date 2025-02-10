import { Vector2D } from "snake-game-engine";

export const SnakeMessage = {
  PLAYER_POSITION_UPDATE: 'player-position-update',
  FOOD_COLLECTED: 'food-collected',
  PLAYER_DIED: 'player-died'
} as const;


export type SnakeMessage = typeof SnakeMessage[keyof typeof SnakeMessage];

export interface PlayerPositionMessage {
  playerId: string;
  positions: Vector2D[];
}

export interface FoodCollectedMessage {
  collectedBy: string;
  newFoodPosition: Vector2D;
}

export interface PlayerDiedMessage {
  playerId: string;
  finalPositions: Vector2D[];
}