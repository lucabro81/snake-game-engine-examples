import { createDOMRenderer } from './rendered';
import { EASY_SCORE_CONFIG, NORMAL_SCORE_CONFIG, HARD_SCORE_CONFIG, COMBO_SCORE_CONFIG } from './score-config';
import { GameConfig, Snake, Vector2D } from 'snake-game-engine';
import '@demo/styles/css/styles.css';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div id="gameBoard" class="game-board"></div>
  <div class="score">Score: <span id="scoreValue" class="score-value">0</span></div>
  <div class="controls">
    <button id="startButton">Start Game</button>
    <select id="difficultySelect">
      <option value="easy">Easy</option>
      <option value="normal" selected>Normal</option>
      <option value="hard">Hard</option>
      <option value="combo">Combo</option>
    </select>
  </div>
  <div class="multiplayer-controls">
    <button id="createRoomBtn">Create Room</button>
    <div class="join-room">
      <input id="roomIdInput" placeholder="Room ID" />
      <button id="joinRoomBtn">Join Room</button>
    </div>
  </div>
  <div id="roomInfo"></div>
`;

let ws: WebSocket;

function connect() {
  ws = new WebSocket("http://localhost:8080");
  console.log("connected", ws);
  ws.onmessage = (event) => {
    console.log("event", event.data);
  };
}

function sendMessage() {
  ws.send("hello");
}

document.querySelector<HTMLDivElement>('#app')?.classList.add('app');

const gameBoard = document.getElementById('gameBoard') as HTMLDivElement;
const startButton = document.getElementById('startButton') as HTMLButtonElement;
const scoreElement = document.getElementById('scoreValue') as HTMLSpanElement;
const difficultySelect = document.getElementById('difficultySelect') as HTMLSelectElement;

const config: GameConfig = {
  width: 20,
  height: 20,
  tickRate: 8,
  continuousSpace: true,
  scoreConfig: getScoreConfig(difficultySelect.value)
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

function handleScoreUpdate(score: number): void {
  scoreElement.textContent = score.toString();
}

function getScoreConfig(difficulty: string) {

  const baseConfig = {
    onScoreUpdate: handleScoreUpdate
  };

  switch (difficulty) {
    case 'easy':
      return {
        ...EASY_SCORE_CONFIG,
        ...baseConfig
      };
    case 'normal':
      return {
        ...NORMAL_SCORE_CONFIG,
        ...baseConfig
      };
    case 'hard':
      return {
        ...HARD_SCORE_CONFIG,
        ...baseConfig
      };
    case 'combo':
      return {
        ...COMBO_SCORE_CONFIG,
        ...baseConfig
      };
    default:
      return {
        ...NORMAL_SCORE_CONFIG,
        ...baseConfig
      };
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


document.querySelector<HTMLButtonElement>('#counter')!
  .addEventListener('click', sendMessage)

document.querySelector<HTMLButtonElement>('#connect')!
  .addEventListener('click', connect)