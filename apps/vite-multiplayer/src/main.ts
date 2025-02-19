import '@demo/styles/css/styles.css';
import { GameConfig } from 'snake-game-engine';
import { domSettings } from './game/configs/dom-settings';
import { gameConfig } from './game/configs/game-config';
import { initializeConnectionManager, setHandlers, SnakeConnectionManager } from './game/connection/connection-manager';
import { setupEventListeners } from './game/event-listeners';
import { getRoomFromPath } from './game/utils';

const initialRoomCode = getRoomFromPath();
const { gameBoard, scoreElement, roomInfo, roomCodeSpan } = domSettings(initialRoomCode ?? '');
const config: GameConfig = gameConfig(scoreElement);

let connectionManager: SnakeConnectionManager | null = null;

// Auto-join room if code is present in URL
if (initialRoomCode) {
  connectionManager = initializeConnectionManager();
  setHandlers(connectionManager, gameBoard, config);

  setTimeout(() => {
    connectionManager?.joinRoom(initialRoomCode);
  }, 1000);
  roomInfo.style.display = 'block';
  roomCodeSpan.textContent = initialRoomCode;
}

setupEventListeners(config, connectionManager);