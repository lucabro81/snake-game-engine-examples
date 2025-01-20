import { useEffect, useRef, useState } from "react";
import { GameConfig, Snake, Vector2D } from "snake-game-engine";
import "./App.css";

import "@demo/styles/css/styles.css";
import { CELL_SIZE, createRenderer } from "./game/renderer";
import { getScoreConfig } from "./game/score";

function App() {
  const [isGameRunning, setIsGameRunning] = useState(false);
  const gameRef = useRef<Snake<HTMLElement> | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const difficultyRef = useRef<HTMLSelectElement>(null);
  const scoreRef = useRef<HTMLSpanElement>(null);

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

  const startGame = () => {
    new Promise((resolve, reject) => {
      setTimeout(() => {
        if (boardRef.current) {
          gameRef?.current?.stop();
          boardRef.current.innerHTML = "";
          const renderer = createRenderer(boardRef.current);
          gameRef.current = new Snake(config, renderer, handleGameOver);
          gameRef.current.start();
          setIsGameRunning(true);
          resolve(true);
        } else {
          reject(new Error("Board element not found"));
        }
      }, 0);
    });
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
    return () => {
      document.removeEventListener("keydown", handleKeydown);
    };
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
