import { RenderConfig, Vector2D } from 'snake-game-engine';

export const createDOMRenderer = (
  container: HTMLElement,
  cellSize: number
): RenderConfig<HTMLElement> => {
  const createCell = (position: Vector2D): HTMLElement => {
    const cell = document.createElement('div');
    cell.className = 'game-cell';
    cell.style.width = `${cellSize - 1}px`;
    cell.style.height = `${cellSize - 1}px`;
    cell.style.left = `${position.x * cellSize}px`;
    cell.style.top = `${position.y * cellSize}px`;
    container.appendChild(cell);
    return cell;
  };

  return {
    cellSize,
    snakeRenderer: (position: Vector2D) => {
      const cell = createCell(position);
      cell.classList.add('snake-segment');
      return cell;
    },
    foodRenderer: (position: Vector2D) => {
      const cell = createCell(position);
      cell.classList.add('food');
      return cell;
    },
    clearRenderer: (element?: HTMLElement) => {
      element?.remove();
    }
  };
};