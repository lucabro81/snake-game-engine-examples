import { ScoreConfig } from "snake-game-engine";

export const EASY_SCORE_CONFIG: ScoreConfig = {
  foodMultiplier: 100,
  movementMultiplier: 0,  // No movement penalty
  useSnakeLength: false
};

export const NORMAL_SCORE_CONFIG: ScoreConfig = {
  foodMultiplier: 100,
  movementMultiplier: -1,
  useSnakeLength: true
};

export const HARD_SCORE_CONFIG: ScoreConfig = {
  foodMultiplier: 50,
  movementMultiplier: -2,
  useSnakeLength: true
};

// Example of custom scoring logic
export const COMBO_SCORE_CONFIG: ScoreConfig = {
  foodMultiplier: 100,
  movementMultiplier: -1,
  useSnakeLength: true,
  calculateScore: (currentScore, points, isFoodCollision, snakeLength) => {
    let multiplier = 1;

    if (isFoodCollision) {
      // Bonus multiplier based on snake length
      multiplier = Math.floor(snakeLength / 5) + 1;
      return currentScore + (points * multiplier * snakeLength);
    }

    // Movement penalty
    return Math.max(0, currentScore - snakeLength);
  }
};