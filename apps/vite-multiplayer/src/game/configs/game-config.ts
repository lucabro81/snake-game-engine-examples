import { NORMAL_SCORE_CONFIG } from "./score-config";
import { GameConfig } from "snake-game-engine";

export function gameConfig(scoreElement: HTMLElement): GameConfig {
  return {
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
  }
}