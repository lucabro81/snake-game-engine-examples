import { useEffect, useRef, useState } from "react";
import "./App.css";
import { GameConfig, Snake, Vector2D } from "snake-game-engine";

import "@demo/styles/css/styles.css";
import {
  COMBO_SCORE_CONFIG,
  EASY_SCORE_CONFIG,
  HARD_SCORE_CONFIG,
  NORMAL_SCORE_CONFIG,
} from "./score-config";

function getScoreConfig(
  difficulty: string,
  scoreRef: React.RefObject<HTMLSpanElement>
) {
  const baseConfig = {
    onScoreUpdate: (score: number) => {
      if (scoreRef.current) {
        scoreRef.current.textContent = score.toString();
      }
    },
  };

  switch (difficulty) {
    case "easy":
      return {
        ...EASY_SCORE_CONFIG,
        ...baseConfig,
      };
    case "normal":
      return {
        ...NORMAL_SCORE_CONFIG,
        ...baseConfig,
      };
    case "hard":
      return {
        ...HARD_SCORE_CONFIG,
        ...baseConfig,
      };
    case "combo":
      return {
        ...COMBO_SCORE_CONFIG,
        ...baseConfig,
      };
    default:
      return {
        ...NORMAL_SCORE_CONFIG,
        ...baseConfig,
      };
  }
}

function App() {
  const [isGameRunning, setIsGameRunning] = useState(false);
  const gameRef = useRef<Snake<HTMLElement> | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const difficultyRef = useRef<HTMLSelectElement>(null);
  const scoreRef = useRef<HTMLSpanElement>(null);

  const CELL_SIZE = 20;
  const config: GameConfig = {
    width: 20,
    height: 20,
    tickRate: 8,
    continuousSpace: true,
    scoreConfig: getScoreConfig(
      difficultyRef.current?.value || "normal",
      scoreRef
    ),
  };

  const handleGameOver = () => {
    alert("Game Over!");
    setIsGameRunning(false);
    if (gameRef.current) {
      gameRef.current.stop();
    }
  };

  // TODO: create a renderer that use react api, don't use dom api
  const createRenderer = (container: HTMLElement) => ({
    cellSize: CELL_SIZE,
    snakeRenderer: (position: Vector2D) => {
      const cell = document.createElement("div");
      cell.className = "game-cell snake-segment";
      cell.style.width = `${CELL_SIZE - 1}px`;
      cell.style.height = `${CELL_SIZE - 1}px`;
      cell.style.left = `${position.x * CELL_SIZE}px`;
      cell.style.top = `${position.y * CELL_SIZE}px`;
      container.appendChild(cell);
      return cell;
    },
    foodRenderer: (position: Vector2D) => {
      const cell = document.createElement("div");
      cell.className = "game-cell food";
      cell.style.width = `${CELL_SIZE - 1}px`;
      cell.style.height = `${CELL_SIZE - 1}px`;
      cell.style.left = `${position.x * CELL_SIZE}px`;
      cell.style.top = `${position.y * CELL_SIZE}px`;
      container.appendChild(cell);
      return cell;
    },
    clearRenderer: (element?: HTMLElement) => {
      element?.remove();
    },
  });

  const startGame = () => {
    if (boardRef.current) {
      boardRef.current.innerHTML = "";
      const renderer = createRenderer(boardRef.current);
      gameRef.current = new Snake(config, renderer, handleGameOver);
      gameRef.current.start();
      setIsGameRunning(true);
    }
  };

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if (!gameRef.current) return;

      const directions: Record<string, Vector2D> = {
        ArrowUp: { x: 0, y: -1 },
        ArrowDown: { x: 0, y: 1 },
        ArrowLeft: { x: -1, y: 0 },
        ArrowRight: { x: 1, y: 0 },
      };

      const newDirection = directions[event.key];
      if (newDirection) {
        gameRef.current.setDirection(newDirection);
      }
    };

    document.addEventListener("keydown", handleKeydown);
    return () => document.removeEventListener("keydown", handleKeydown);
  }, []);

  return (
    <div className="app">
      <div
        ref={boardRef}
        className="game-board"
        style={{
          width: config.width * CELL_SIZE,
          height: config.height * CELL_SIZE,
        }}
      ></div>
      <div className="score">
        Score:{" "}
        <span className="score-value" ref={scoreRef}>
          0
        </span>
      </div>
      <div className="controls">
        <button onClick={startGame}>
          {isGameRunning ? "Restart Game" : "Start Game"}
        </button>
        <select ref={difficultyRef}>
          <option value="easy">Easy</option>
          <option value="normal" selected>
            Normal
          </option>
          <option value="hard">Hard</option>
          <option value="combo">Combo</option>
        </select>
      </div>
    </div>
  );
}

export default App;
