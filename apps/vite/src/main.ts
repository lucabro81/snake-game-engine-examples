import { createDOMRenderer } from './rendered';
import './style.css'
import { GameConfig, Snake, Vector2D } from 'snake-game-engine';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div id="game-board"></div>
  <div class="controls">
    <button id="startButton">Start Game</button>
  </div>
`

const gameBoard = document.getElementById('game-board') as HTMLDivElement;
const startButton = document.getElementById('startButton') as HTMLButtonElement;

const config: GameConfig = {
  width: 20,
  height: 20,
  tickRate: 8,
  continuousSpace: true
};

const CELL_SIZE = 20;
gameBoard.style.width = `${config.width * CELL_SIZE}px`;
gameBoard.style.height = `${config.height * CELL_SIZE}px`;

let game: Snake<HTMLElement> | null = null;

function handleGameOver() {
  alert('Game Over!');
  startButton.textContent = 'Restart Game';
  if (game) {
    game.stop();
  }
}

function handleKeydown(event: KeyboardEvent) {
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

startButton.addEventListener('click', () => {
  if (game) {
    game.stop();
  }
  // Clear previous game elements
  gameBoard.innerHTML = '';

  const renderer = createDOMRenderer(gameBoard, CELL_SIZE);
  game = new Snake(config, renderer, handleGameOver);
  game.start();
  startButton.textContent = 'Restart Game';
});

document.addEventListener('keydown', handleKeydown);
