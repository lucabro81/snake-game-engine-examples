import { GameConfig } from "snake-game-engine";
import { gameConfig } from "./game-config";
import { CELL_SIZE } from "../const";

const dom = (initialRoomCode: string) => document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div class="app">
    <div>You are: <strong id="playerId">--</strong></div>
    <div id="gameBoard" class="game-board"></div>
    <div class="score">Score: <span id="scoreValue" class="score-value">0</span></div>
    <div class="controls">
      ${!initialRoomCode ? `
        <div id="roomControls">
          <button id="createRoomBtn">Create Room</button>
        </div>
      ` : ''}
    </div>
    <div id="roomInfo" style="display: none;">
      Room Code: <span id="roomCode"></span>
    </div>
  </div>
`;

const domeElements = {
  gameBoard: document.getElementById('gameBoard') as HTMLDivElement,
  scoreElement: document.getElementById('scoreValue') as HTMLSpanElement,
  roomControls: document.getElementById('roomControls'),
  roomInfo: document.getElementById('roomInfo') as HTMLDivElement,
  roomCodeSpan: document.getElementById('roomCode') as HTMLSpanElement,
  createRoomBtn: document.getElementById('createRoomBtn'),
  playerId: document.getElementById('playerId') as HTMLSpanElement
}

export function getDomElements() {

  const gameBoard = domeElements.gameBoard || document.getElementById('gameBoard') as HTMLDivElement;
  const scoreElement = domeElements.scoreElement || document.getElementById('scoreValue') as HTMLSpanElement;
  const roomControls = domeElements.roomControls || document.getElementById('roomControls');
  const roomInfo = domeElements.roomInfo || document.getElementById('roomInfo') as HTMLDivElement;
  const roomCodeSpan = domeElements.roomCodeSpan || document.getElementById('roomCode') as HTMLSpanElement;
  const createRoomBtn = domeElements.createRoomBtn || document.getElementById('createRoomBtn');
  const playerId = domeElements.playerId || document.getElementById('playerId') as HTMLSpanElement;

  domeElements.gameBoard = gameBoard;
  domeElements.scoreElement = scoreElement;
  domeElements.roomControls = roomControls;
  domeElements.roomInfo = roomInfo;
  domeElements.roomCodeSpan = roomCodeSpan;
  domeElements.createRoomBtn = createRoomBtn;
  domeElements.playerId = playerId;

  return {
    gameBoard,
    scoreElement,
    roomControls,
    roomInfo,
    roomCodeSpan,
    createRoomBtn,
    playerId
  }
}

export const domSettings = (initialRoomCode: string) => {
  console.log('Setting up DOM');
  const app = dom(initialRoomCode);

  const { gameBoard, scoreElement, roomControls, roomInfo, roomCodeSpan, createRoomBtn, playerId } = getDomElements();

  const config: GameConfig = gameConfig(scoreElement);

  gameBoard.style.width = `${config.width * CELL_SIZE}px`;
  gameBoard.style.height = `${config.height * CELL_SIZE}px`;

  return {
    app,
    gameBoard,
    scoreElement,
    roomControls,
    roomInfo,
    roomCodeSpan,
    createRoomBtn,
    playerId
  }
}