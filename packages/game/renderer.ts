import type { Vector2D } from "snake-game-engine";

export const CELL_SIZE = 20;

export const createRenderer = (container: HTMLElement) => ({
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