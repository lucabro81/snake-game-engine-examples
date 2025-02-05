import { WebSocketService } from "@/services/websocket.service";
import { Vector2D } from "snake-game-engine";
import { GameStateMessage, PlayerJoinedMessage, ErrorMessage, GameMessageType, RoomCreatedMessage } from "./utils/game-messages";
import { PlayerPositionMessage, FoodCollectedMessage, PlayerDiedMessage, SnakeMessageType } from "./utils/snake-message";


export class SnakeConnectionManager {
  private wsService: WebSocketService;
  private roomId?: string;
  private playerId?: string;

  constructor(
    serverUrl: string,
    private callbacks: {
      onGameState: (state: GameStateMessage) => void;
      onPlayerJoined: (data: PlayerJoinedMessage) => void;
      onPlayerLeft: (playerId: string) => void;
      onPlayerPosition: (data: PlayerPositionMessage) => void;
      onFoodCollected: (data: FoodCollectedMessage) => void;
      onPlayerDied: (data: PlayerDiedMessage) => void;
      onError: (error: ErrorMessage) => void;
      onGameCanStart: () => void;
    }
  ) {
    this.wsService = new WebSocketService(serverUrl);
    this.setupMessageHandlers();
  }

  private setupMessageHandlers() {
    // Game management message handlers
    this.wsService.on(GameMessageType.ROOM_CREATED, (data: RoomCreatedMessage) => {
      this.roomId = data.roomId;
      this.playerId = data.playerId;
    });

    this.wsService.on(GameMessageType.GAME_STATE, this.callbacks.onGameState);
    this.wsService.on(GameMessageType.PLAYER_JOINED, this.callbacks.onPlayerJoined);
    this.wsService.on(GameMessageType.PLAYER_LEFT, this.callbacks.onPlayerLeft);
    this.wsService.on(GameMessageType.GAME_CAN_START, this.callbacks.onGameCanStart);
    this.wsService.on(GameMessageType.ERROR, this.callbacks.onError);

    // Snake specific message handlers
    this.wsService.on(SnakeMessageType.PLAYER_POSITION_UPDATE, this.callbacks.onPlayerPosition);
    this.wsService.on(SnakeMessageType.FOOD_COLLECTED, this.callbacks.onFoodCollected);
    this.wsService.on(SnakeMessageType.PLAYER_DIED, this.callbacks.onPlayerDied);
  }

  // Room management methods
  createRoom() {
    this.wsService.send(GameMessageType.CREATE_ROOM, {});
  }

  joinRoom(roomId: string) {
    this.wsService.send(GameMessageType.JOIN_ROOM, { roomId });
  }

  startGame() {
    if (this.roomId) {
      this.wsService.send(GameMessageType.START_GAME, { roomId: this.roomId });
    }
  }

  // Gameplay methods
  sendPosition(positions: Vector2D[]) {
    if (this.playerId && this.roomId) {
      this.wsService.send(SnakeMessageType.PLAYER_POSITION_UPDATE, {
        playerId: this.playerId,
        positions
      });
    }
  }

  notifyFoodCollected(newFoodPosition: Vector2D) {
    if (this.playerId && this.roomId) {
      this.wsService.send(SnakeMessageType.FOOD_COLLECTED, {
        collectedBy: this.playerId,
        newFoodPosition
      });
    }
  }

  notifyPlayerDied(finalPositions: Vector2D[]) {
    if (this.playerId && this.roomId) {
      this.wsService.send(SnakeMessageType.PLAYER_DIED, {
        playerId: this.playerId,
        finalPositions
      });
    }
  }

  disconnect() {
    this.wsService.disconnect();
  }
}