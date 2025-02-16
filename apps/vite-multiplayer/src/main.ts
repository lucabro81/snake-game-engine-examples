import '@demo/styles/css/styles.css';
import { GameConfig } from 'snake-game-engine';
import { domSettings } from './game/configs/dom-settings';
import { gameConfig } from './game/configs/game-config';
import { initializeConnectionManager, SnakeConnectionManager } from './game/connection/connection-manager';
import { GameMessage } from './game/connection/types/game-messages';
import { setupEventListeners } from './game/event-listeners';
import { getRoomFromPath, setupMultiplayerGame, useGame } from './game/utils';

const initialRoomCode = getRoomFromPath();
const { gameBoard, scoreElement, roomInfo, roomCodeSpan } = domSettings(initialRoomCode ?? '');
const config: GameConfig = gameConfig(scoreElement);

let connectionManager: SnakeConnectionManager | null = null;

// Auto-join room if code is present in URL
if (initialRoomCode) {
  connectionManager = initializeConnectionManager(gameBoard);

  connectionManager.on(GameMessage.ROOM_JOINED, (data) => {
    console.log('Room joined:', data);
    roomCodeSpan.textContent = data.roomId;
    const [, setGame] = useGame(null);
    const game = setupMultiplayerGame(data.playerId, gameBoard, config, connectionManager);
    setGame(game);
  });

  setTimeout(() => {
    connectionManager?.joinRoom(initialRoomCode);
  }, 1000);
  roomInfo.style.display = 'block';
  roomCodeSpan.textContent = initialRoomCode;
}

setupEventListeners(config, connectionManager);