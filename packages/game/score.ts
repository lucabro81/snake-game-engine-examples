import { EASY_SCORE_CONFIG, NORMAL_SCORE_CONFIG, HARD_SCORE_CONFIG, COMBO_SCORE_CONFIG } from "./score-config";

export function getScoreConfig(
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