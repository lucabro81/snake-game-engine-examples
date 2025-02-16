import { MultiplayerSnake, Vector2D } from "snake-game-engine";
import { GameStateMessage, PlayerJoinedMessage, ErrorMessage, RoomCreatedMessage, GameMessage } from "./types/game-messages";
import { PlayerPositionMessage, FoodCollectedMessage, PlayerDiedMessage, SnakeMessage } from "./types/snake-message";
import { WebSocketService } from "../../services/websocket.service";
import { useGame } from "../utils";

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

export function initializeConnectionManager(gameBoard: HTMLElement) {
  const connectionManager = new SnakeConnectionManager(
    'ws://localhost:8080',
    {
      onGameState: (state) => {
        console.log('Game state:', state);
        state.players.forEach(player => {
          const [game] = useGame();
          game?.addPlayer(player.id, player.snake[0] ?? { x: 0, y: 0 });
          // game?.updatePlayerPosition(player.id, player.snake);
        });
        if (state.foodPosition) {
          const [game] = useGame();
          game?.updateFoodPosition(state.foodPosition);
        }
      },
      onPlayerJoined: (data) => {
        console.log('Player joined:', data);
        const [game] = useGame();
        game?.addPlayer(data.playerId, data.position);
      },
      onPlayerLeft: (playerId) => {
        const [game] = useGame();
        game?.removePlayer(playerId);
      },
      onPlayerPosition: (data) => {
        const [game] = useGame();
        game?.receivePlayerUpdate(data.playerId, data.positions);
      },
      onFoodCollected: (data) => {
        const [game] = useGame();
        game?.updateFoodPosition(data.newFoodPosition);
      },
      onPlayerDied: (data) => {
        const [game] = useGame();
        game?.removePlayer(data.playerId);
      },
      onError: (error) => {
        alert(`Error: ${error.message}`);
      },
      onGameCanStart: () => {
        const [game] = useGame();
        if (game) {
          game.start();
        }
        // Optional: Show a message that game is starting
        const statusDiv = document.createElement('div');
        statusDiv.textContent = 'Game starting...';
        statusDiv.className = 'game-status';
        gameBoard.parentElement?.insertBefore(statusDiv, gameBoard);
        // Remove the message after a short delay
        setTimeout(() => statusDiv.remove(), 1000);
      }
    }
  );

  return connectionManager;
}
