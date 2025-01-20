<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { Snake, type GameConfig, type Vector2D } from "snake-game-engine";
import { CELL_SIZE, createRenderer, getScoreConfig } from "@demo/game";

const boardRef = ref<HTMLDivElement>();
const gameRef = ref<Snake<HTMLElement> | null>(null);
const difficultyRef = ref<HTMLSelectElement | null>(null);
const scoreRef = ref<Snake<HTMLElement> | null>(null);
const isGameRunning = ref(false);

const config: GameConfig = {
  width: 20,
  height: 20,
  tickRate: 8,
  continuousSpace: true,
  scoreConfig: getScoreConfig(
    difficultyRef?.value?.value || "normal",
    scoreRef
  ),
};

const handleGameOver = () => {
  alert("Game Over!");
  isGameRunning.value = false;
  gameRef.value?.stop();
};

const startGame = () => {
  if (boardRef.value) {
    gameRef.value?.stop();
    boardRef.value.innerHTML = "";
    const renderer = createRenderer(boardRef.value);
    gameRef.value = new Snake(config, renderer, handleGameOver);
    gameRef.value.start();
    isGameRunning.value = true;
  }
};

const handleKeydown = (event: KeyboardEvent) => {
  if (!gameRef.value) return;

  const directions: Record<string, Vector2D> = {
    ArrowUp: { x: 0, y: -1 },
    ArrowDown: { x: 0, y: 1 },
    ArrowLeft: { x: -1, y: 0 },
    ArrowRight: { x: 1, y: 0 },
  };

  const newDirection = directions[event.key];
  if (newDirection) {
    gameRef.value.setDirection(newDirection);
  }
};

onMounted(() => {
  document.addEventListener("keydown", handleKeydown);
});

onUnmounted(() => {
  document.removeEventListener("keydown", handleKeydown);
  gameRef.value?.stop();
});
</script>

<template>
  <div class="app">
    <div
      ref="boardRef"
      class="game-board"
      :style="{
        width: `${config.width * CELL_SIZE}px`,
        height: `${config.height * CELL_SIZE}px`,
      }"
    />
    <div class="score">
      Score: <span class="score-value" ref="scoreRef"> 0 </span>
    </div>
    <div class="controls">
      <button @click="startGame">
        {{ isGameRunning ? "Restart Game" : "Start Game" }}
      </button>
      <select ref="difficultyRef">
        <option value="easy">Easy</option>
        <option value="normal" selected>Normal</option>
        <option value="hard">Hard</option>
        <option value="combo">Combo</option>
      </select>
    </div>
  </div>
</template>
