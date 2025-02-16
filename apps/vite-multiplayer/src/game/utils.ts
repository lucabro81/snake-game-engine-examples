import { GameConfig, RenderConfig, Vector2D } from "snake-game-engine";
import { MultiplayerSnake } from "snake-game-engine";
import { CELL_SIZE } from "./const";
import { SnakeConnectionManager } from "./connection/connection-manager";
import { createDOMRenderer } from "./rendered";

export function getRoomFromPath(): string | undefined {
  const path = window.location.pathname;
  const match = path.match(/^\/room\/([A-Za-z0-9]+)$/);
  return match ? match[1] : undefined;
}

export function setRoomInPath(roomId: string) {
  console.log('Setting room in path:', roomId);
  const newPath = `/room/${roomId}`;
  window.history.pushState({}, '', newPath);
}

export function handleGameOver(game: MultiplayerSnake<HTMLElement> | null) {
  alert('Game Over!');
  if (game) {
    game.stop();
  }
}

export function handleKeydown(event: KeyboardEvent, game: MultiplayerSnake<HTMLElement> | null) {
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

export function setupMultiplayerGame(playerId: string, gameBoard: HTMLElement, config: GameConfig, connectionManager: SnakeConnectionManager | null) {
  const renderer = createDOMRenderer(gameBoard, CELL_SIZE);

  const game = new MultiplayerSnake(
    playerId,
    config,
    renderer,
    {
      onFoodCollected: (data) => {
        connectionManager?.notifyFoodCollected(data.newFoodPosition);
      },
      onPlayerPositionUpdate: (playerId, positions) => {
        connectionManager?.sendPosition(positions);
      },
      onPlayerDied: (playerId, finalPositions) => {
        connectionManager?.notifyPlayerDied(finalPositions);
      }
    },
    () => handleGameOver(game)
  );

  return game;
}

let arrToReturn: [MultiplayerSnake<HTMLElement> | null, (game: MultiplayerSnake<HTMLElement>) => void] = [null, (game: MultiplayerSnake<HTMLElement>) => {
  arrToReturn[0] = game;
}];

export const useGame = (initialGame?: MultiplayerSnake<HTMLElement> | null) => {
  const [, setGame] = arrToReturn;
  if (initialGame) {
    setGame(initialGame);
  }
  return arrToReturn;
}