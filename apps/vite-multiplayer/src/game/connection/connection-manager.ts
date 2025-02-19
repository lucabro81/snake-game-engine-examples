import { GameConfig, MultiplayerSnake, Vector2D } from "snake-game-engine";
import { GameStateMessage, PlayerJoinedMessage, ErrorMessage, RoomCreatedMessage, GameMessage } from "./types/game-messages";
import { PlayerPositionMessage, FoodCollectedMessage, PlayerDiedMessage, SnakeMessage } from "./types/snake-message";
import { WebSocketService } from "../../services/websocket.service";
import { setRoomInPath, setupMultiplayerGame, useGame } from "../utils";
import { getDomElements } from "../configs/dom-settings";

export type GameHandlers = {
  onGameState: (state: GameStateMessage) => void;
  onPlayerJoined: (data: PlayerJoinedMessage) => void;
  onPlayerLeft: (playerId: string) => void;
  onPlayerPosition: (data: PlayerPositionMessage) => void;
  onFoodCollected: (data: FoodCollectedMessage) => void;
  onPlayerDied: (data: PlayerDiedMessage) => void;
  onError: (error: ErrorMessage) => void;
  onGameCanStart: () => void;
  onGameStateRequest: () => GameStateMessage | null;
  onRoomCreated?: (data: RoomCreatedMessage) => void;
  onRoomJoined?: (data: RoomCreatedMessage) => void;
};

export class SnakeConnectionManager {
  private wsService: WebSocketService<SnakeMessage>;
  private roomId?: string;
  private playerId?: string;
  private handlers: GameHandlers = {
    onGameState: () => { },
    onPlayerJoined: () => { },
    onPlayerLeft: () => { },
    onPlayerPosition: () => { },
    onFoodCollected: () => { },
    onPlayerDied: () => { },
    onError: () => { },
    onGameCanStart: () => { },
    onGameStateRequest: () => null,
    onRoomCreated: () => { },
    onRoomJoined: () => { },
  };

  constructor(serverUrl: string) {
    this.wsService = new WebSocketService(serverUrl);
    this.setupMessageHandlers();
  }

  setHandlers(handlers: GameHandlers) {
    this.handlers = handlers;
    this.setupMessageHandlers();
  }

  private setupMessageHandlers() {
    // Game management message handlers
    this.wsService.on(GameMessage.ROOM_CREATED, (data: RoomCreatedMessage) => {
      this.roomId = data.roomId;
      this.playerId = data.playerId;
      this.handlers.onRoomCreated?.(data);
      console.log('Room created, setting IDs:', this.roomId, this.playerId);
    });

    this.wsService.on(GameMessage.ROOM_JOINED, (data: RoomCreatedMessage) => {
      this.roomId = data.roomId;
      this.playerId = data.playerId;
      this.handlers.onRoomJoined?.(data);
      console.log('Room joined, setting IDs:', this.roomId, this.playerId);
    });

    this.wsService.on(GameMessage.REQUEST_GAME_STATE, () => {
      const state = this.handlers.onGameStateRequest();
      console.log(`server requested game state to [${this.playerId}]`, state);
      if (state) {
        this.wsService.send(GameMessage.GAME_STATE_UPDATE, state);
      }
    });

    this.wsService.on(GameMessage.GAME_STATE, this.handlers.onGameState);
    this.wsService.on(GameMessage.PLAYER_JOINED, this.handlers.onPlayerJoined);
    this.wsService.on(GameMessage.PLAYER_LEFT, this.handlers.onPlayerLeft);
    this.wsService.on(GameMessage.GAME_CAN_START, this.handlers.onGameCanStart);
    this.wsService.on(GameMessage.ERROR, this.handlers.onError);

    // Snake specific message handlers
    this.wsService.on(SnakeMessage.PLAYER_POSITION_UPDATE, this.handlers.onPlayerPosition);
    this.wsService.on(SnakeMessage.FOOD_COLLECTED, this.handlers.onFoodCollected);
    this.wsService.on(SnakeMessage.PLAYER_DIED, this.handlers.onPlayerDied);

    console.log('Registered handlers:', Array.from(this.wsService['messageHandlers'].keys()));
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
    // console.log('sendPosition:', positions);
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

export function initializeConnectionManager() {
  const connectionManager = new SnakeConnectionManager(
    'ws://localhost:8080',
  );

  return connectionManager;
}

export function setHandlers(connectionManager: SnakeConnectionManager, gameBoard: HTMLElement, config: GameConfig) {
  connectionManager.setHandlers({
    onGameStateRequest: () => {

      const [game] = useGame();
      console.log('onGameStateRequest', game);
      if (!game) {
        return null;
      }
      return game.getGameState();
    },
    onGameState: (state) => {

      console.log('onGameState:', state);

      const [game] = useGame();
      if (!game) return;

      // Clear existing players first
      state.players.forEach(player => {
        game.removePlayer(player.id);
      });

      // Add players with their current positions
      state.players.forEach(player => {
        const initialPosition = player.snake[0] || game.getRandomStartPosition();
        game.addPlayer(player.id, initialPosition);
        if (player.snake.length > 0) {
          game.updatePlayerPosition(player.id, player.snake);
        }
      });

      if (state.foodPosition) {
        game.updateFoodPosition(state.foodPosition);
      }
    },
    onPlayerJoined: (data) => {
      console.log('Player joined:', data);
      const [game] = useGame();
      if (!game) return;

      // Use provided position or get a random one
      const position = data.position || game.getRandomStartPosition();
      game.addPlayer(data.playerId, position);
    },
    onPlayerLeft: (playerId) => {
      const [game] = useGame();
      game?.removePlayer(playerId);
    },
    onPlayerPosition: (data) => {
      // console.log('Client received position update:', data);
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
        setTimeout(() => {
          game.start();
        }, 500);
      }
      // Optional: Show a message that game is starting
      const statusDiv = document.createElement('div');
      statusDiv.textContent = 'Game starting...';
      statusDiv.className = 'game-status';
      gameBoard.parentElement?.insertBefore(statusDiv, gameBoard);
      // Remove the message after a short delay
      setTimeout(() => statusDiv.remove(), 1000);
    },
    onRoomCreated: (data) => {
      console.log('onRoomCreated:', data);
      const { roomCodeSpan } = getDomElements();
      setRoomInPath(data.roomId);
      roomCodeSpan.textContent = data.roomId;
      const [, setGame] = useGame(null);
      const newGame = setupMultiplayerGame(data.playerId, gameBoard, config, connectionManager);
      setGame(newGame);
    },
    onRoomJoined: (data) => {
      console.log('onRoomJoined:', data);
      const { roomCodeSpan } = getDomElements();
      roomCodeSpan.textContent = data.roomId;
      const [, setGame] = useGame(null);
      const game = setupMultiplayerGame(data.playerId, gameBoard, config, connectionManager);
      setGame(game);
    }
  });
}

// export function setOnRoomCreated(connectionManager: SnakeConnectionManager, onRoomCreated: (data: RoomCreatedMessage) => void) {
//   connectionManager.setOnRoomCreated(onRoomCreated);
// }


/*
{
      onGameStateRequest: () => {

        const [game] = useGame();
        if (!game) {
          return null;
        }
        return game.getGameState();
      },
      onGameState: (state) => {
        console.log('Game state:', state);

        const [game] = useGame();
        if (!game) return;

        // Clear existing players first
        state.players.forEach(player => {
          game.removePlayer(player.id);
        });

        // Add players with their current positions
        state.players.forEach(player => {
          const initialPosition = player.snake[0] || game.getRandomStartPosition();
          game.addPlayer(player.id, initialPosition);
          if (player.snake.length > 0) {
            game.updatePlayerPosition(player.id, player.snake);
          }
        });

        if (state.foodPosition) {
          game.updateFoodPosition(state.foodPosition);
        }
      },
      onPlayerJoined: (data) => {
        console.log('Player joined:', data);
        const [game] = useGame();
        if (!game) return;

        // Use provided position or get a random one
        const position = data.position || game.getRandomStartPosition();
        game.addPlayer(data.playerId, position);
      },
      onPlayerLeft: (playerId) => {
        const [game] = useGame();
        game?.removePlayer(playerId);
      },
      onPlayerPosition: (data) => {
        console.log('Received player position:', data);
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
          setTimeout(() => {
            game.start();
          }, 500);
        }
        // Optional: Show a message that game is starting
        const statusDiv = document.createElement('div');
        statusDiv.textContent = 'Game starting...';
        statusDiv.className = 'game-status';
        gameBoard.parentElement?.insertBefore(statusDiv, gameBoard);
        // Remove the message after a short delay
        setTimeout(() => statusDiv.remove(), 1000);
      },
      onRoomCreated: (data) => {
        const { roomCodeSpan } = getDomElements();
        setRoomInPath(data.roomId);
        roomCodeSpan.textContent = data.roomId;
        const [, setGame] = useGame(null);
        const newGame = setupMultiplayerGame(data.playerId, gameBoard, config, manager);
        setGame(newGame);
      }
    }
 */