import { createDOMRenderer } from './rendered';
import { EASY_SCORE_CONFIG, NORMAL_SCORE_CONFIG, HARD_SCORE_CONFIG, COMBO_SCORE_CONFIG } from './score-config';
import { GameConfig, Snake, Vector2D, MultiplayerSnake } from 'snake-game-engine';
import '@demo/styles/css/styles.css';
import { SnakeConnectionManager } from './game/connection-manager';

// Function to extract room code from URL
function getRoomFromPath(): string | null {
  const path = window.location.pathname;
  const match = path.match(/^\/room\/([A-Za-z0-9]+)$/);
  return match ? match[1] : null;
}

// Function to set URL to room code
function setRoomInPath(roomId: string) {
  const newPath = `/room/${roomId}`;
  window.history.pushState({}, '', newPath);
}

// Get room code if present in URL
const initialRoomCode = getRoomFromPath();

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div class="app">
    <div id="gameBoard" class="game-board"></div>
    <div class="score">Score: <span id="scoreValue" class="score-value">0</span></div>
    <div class="controls">
      ${!initialRoomCode ? `
        <div id="roomControls">
          <button id="createRoomBtn">Create Room</button>
        </div>
      ` : ''}
      <div id="gameControls" style="display: none;">
        <button id="startButton" disabled>Waiting for players...</button>
      </div>
    </div>
    <div id="roomInfo" style="display: none;">
      Room Code: <span id="roomCode"></span>
    </div>
  </div>
`;

// Get DOM elements
const gameBoard = document.getElementById('gameBoard') as HTMLDivElement;
const startButton = document.getElementById('startButton') as HTMLButtonElement;
const scoreElement = document.getElementById('scoreValue') as HTMLSpanElement;
const roomControls = document.getElementById('roomControls');
const gameControls = document.getElementById('gameControls') as HTMLDivElement;
const roomInfo = document.getElementById('roomInfo') as HTMLDivElement;
const roomCodeSpan = document.getElementById('roomCode') as HTMLSpanElement;
const createRoomBtn = document.getElementById('createRoomBtn');

// Game configuration
const config: GameConfig = {
  width: 20,
  height: 20,
  tickRate: 8,
  continuousSpace: true,
  scoreConfig: {
    ...NORMAL_SCORE_CONFIG,
    onScoreUpdate: (score: number) => {
      scoreElement.textContent = score.toString();
    }
  }
};

const CELL_SIZE = 20;
gameBoard.style.width = `${config.width * CELL_SIZE}px`;
gameBoard.style.height = `${config.height * CELL_SIZE}px`;

let game: MultiplayerSnake<HTMLElement> | null = null;
let connectionManager: SnakeConnectionManager | null = null;

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

function setupMultiplayerGame(playerId: string) {
  const renderer = createDOMRenderer(gameBoard, CELL_SIZE);

  game = new MultiplayerSnake(
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
    handleGameOver
  );
}

function initializeConnectionManager() {
  connectionManager = new SnakeConnectionManager(
    'ws://localhost:8080',
    {
      onGameState: (state) => {
        state.players.forEach(player => {
          game?.addPlayer(player.id, player.snake[0]);
        });
        if (state.foodPosition) {
          game?.updateFoodPosition(state.foodPosition);
        }
      },
      onPlayerJoined: (data) => {
        game?.addPlayer(data.playerId, data.position);
      },
      onPlayerLeft: (playerId) => {
        game?.removePlayer(playerId);
      },
      onPlayerPosition: (data) => {
        game?.receivePlayerUpdate(data.playerId, data.positions);
      },
      onFoodCollected: (data) => {
        game?.updateFoodPosition(data.newFoodPosition);
      },
      onPlayerDied: (data) => {
        game?.removePlayer(data.playerId);
      },
      onError: (error) => {
        alert(`Error: ${error.message}`);
      },
      onGameCanStart: () => {
        startButton.disabled = false;
        startButton.textContent = 'Start Game';
      }
    }
  );

  return connectionManager;
}

// Event Handlers
createRoomBtn?.addEventListener('click', () => {
  const manager = initializeConnectionManager();
  manager.on('room-created', (data) => {
    setRoomInPath(data.roomId);
    roomCodeSpan.textContent = data.roomId;
  });
  manager.createRoom();
  if (roomControls) roomControls.style.display = 'none';
  gameControls.style.display = 'block';
  roomInfo.style.display = 'block';
});

startButton.addEventListener('click', () => {
  if (game) {
    game.stop();
  }
  game?.start();
  startButton.textContent = 'Restart Game';
});

document.addEventListener('keydown', handleKeydown);

// Auto-join room if code is present in URL
if (initialRoomCode) {
  const manager = initializeConnectionManager();
  manager.joinRoom(initialRoomCode);
  gameControls.style.display = 'block';
  roomInfo.style.display = 'block';
  roomCodeSpan.textContent = initialRoomCode;
}

// Clean up on page unload
window.addEventListener('beforeunload', () => {
  connectionManager?.disconnect();
  game?.stop();
});