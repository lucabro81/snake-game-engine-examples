import { Vector2D } from "snake-game-engine";
import { GameStateMessage, PlayerJoinedMessage, ErrorMessage, RoomCreatedMessage, GameMessage } from "./utils/game-messages";
import { PlayerPositionMessage, FoodCollectedMessage, PlayerDiedMessage, SnakeMessage } from "./utils/snake-message";
import { WebSocketService } from "../services/websocket.service";
export class SnakeConnectionManager {
  private wsService: WebSocketService<SnakeMessage>;
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
    this.wsService.on(GameMessage.ROOM_CREATED, (data: RoomCreatedMessage) => {
      this.roomId = data.roomId;
      this.playerId = data.playerId;
    });

    this.wsService.on(GameMessage.GAME_STATE, this.callbacks.onGameState);
    this.wsService.on(GameMessage.PLAYER_JOINED, this.callbacks.onPlayerJoined);
    this.wsService.on(GameMessage.PLAYER_LEFT, this.callbacks.onPlayerLeft);
    this.wsService.on(GameMessage.GAME_CAN_START, this.callbacks.onGameCanStart);
    this.wsService.on(GameMessage.ERROR, this.callbacks.onError);

    // Snake specific message handlers
    this.wsService.on(SnakeMessage.PLAYER_POSITION_UPDATE, this.callbacks.onPlayerPosition);
    this.wsService.on(SnakeMessage.FOOD_COLLECTED, this.callbacks.onFoodCollected);
    this.wsService.on(SnakeMessage.PLAYER_DIED, this.callbacks.onPlayerDied);
  }

  // Room management methods
  createRoom() {
    console.log('Creating room');
    this.wsService.send(GameMessage.CREATE_ROOM, {});
  }

  joinRoom(roomId: string) {
    this.wsService.send(GameMessage.JOIN_ROOM, { roomId });
  }

  startGame() {
    if (this.roomId) {
      this.wsService.send(GameMessage.START_GAME, { roomId: this.roomId });
    }
  }

  // Gameplay methods
  sendPosition(positions: Vector2D[]) {
    if (this.playerId && this.roomId) {
      this.wsService.send(SnakeMessage.PLAYER_POSITION_UPDATE, {
        playerId: this.playerId,
        positions
      });
    }
  }

  notifyFoodCollected(newFoodPosition: Vector2D) {
    if (this.playerId && this.roomId) {
      this.wsService.send(SnakeMessage.FOOD_COLLECTED, {
        collectedBy: this.playerId,
        newFoodPosition
      });
    }
  }

  notifyPlayerDied(finalPositions: Vector2D[]) {
    if (this.playerId && this.roomId) {
      this.wsService.send(SnakeMessage.PLAYER_DIED, {
        playerId: this.playerId,
        finalPositions
      });
    }
  }

  disconnect() {
    this.wsService.disconnect();
  }

  on(messageType: SnakeMessage | GameMessage, handler: (data: any) => void) {
    this.wsService.on(messageType, handler);
  }
}