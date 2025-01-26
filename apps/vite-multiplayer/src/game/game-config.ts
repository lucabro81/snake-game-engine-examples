import { GameConfig } from "snake-game-engine";
import { EASY_SCORE_CONFIG, NORMAL_SCORE_CONFIG, HARD_SCORE_CONFIG, COMBO_SCORE_CONFIG } from "./score-config";

function handleScoreUpdate(score: number, scoreElement: HTMLElement): void {
  scoreElement.textContent = score.toString();
}

function getScoreConfig(difficulty: string, scoreElement: HTMLElement) {

  const baseConfig = {
    onScoreUpdate: (score: number) => handleScoreUpdate(score, scoreElement)
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

export function useGameConfig(scoreElement: HTMLElement, difficultySelect: HTMLSelectElement) {

  const config: GameConfig = {
    width: 20,
    height: 20,
    tickRate: 8,
    continuousSpace: true,
    scoreConfig: getScoreConfig(difficultySelect.value, scoreElement)
  };

  return config;

}