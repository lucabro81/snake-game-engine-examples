import { GameConfig, Vector2D } from "snake-game-engine";

import { MultiplayerSnake } from "snake-game-engine";
import { GameMessage } from "./connection/types/game-messages";
import { setupMultiplayerGame, useGame } from "./utils";
import { getDomElements } from "./configs/dom-settings";
import { initializeConnectionManager, SnakeConnectionManager } from "./connection/connection-manager";
import { setRoomInPath } from "./utils";

function handleKeydown(event: KeyboardEvent) {
  const [game] = useGame();
  if (!game) return;

  const directions: Record<string, Vector2D> = {
    'ArrowUp': { x: 0, y: -1 },
    'ArrowDown': { x: 0, y: 1 },
    'ArrowLeft': { x: -1, y: 0 },
    'ArrowRight': { x: 1, y: 0 }
  };

  const newDirection = directions[event.key];
  if (newDirection) {
    game.setDirection(newDirection);
  }
}

function handleCreateRoomClick(config: GameConfig) {
  const { gameBoard, roomControls, roomInfo, roomCodeSpan } = getDomElements();

  const [, setGame] = useGame(null);

  const manager = initializeConnectionManager(gameBoard);

  manager.on(GameMessage.ROOM_CREATED, (data) => {
    setRoomInPath(data.roomId);
    roomCodeSpan.textContent = data.roomId;
    const newGame = setupMultiplayerGame(data.playerId, gameBoard, config, manager);
    setGame(newGame);
  });

  setTimeout(() => {
    manager.createRoom();
  }, 1000);
  if (roomControls) {
    roomControls.style.display = 'none';
  }
  else {
    roomInfo.style.display = 'block';
  }
}

export function setupEventListeners(config: GameConfig, connectionManager: SnakeConnectionManager | null) {

  const { createRoomBtn } = getDomElements();

  document.addEventListener('keydown', (event) => handleKeydown(event));
  createRoomBtn?.addEventListener('click', () => handleCreateRoomClick(config));

  // Clean up on page unload
  window.addEventListener('beforeunload', () => {
    connectionManager?.disconnect();
    const [game] = useGame();
    game?.stop();
  });
}