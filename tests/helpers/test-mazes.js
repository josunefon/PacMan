/**
 * Test maze fixtures — small, controlled layouts for unit tests.
 *
 * All mazes are 28×31 (matching MAZE_COLS/MAZE_ROWS) so that the
 * maze module's bounds-checking works correctly. We fill with WALL
 * by default, then carve out specific patterns for each test need.
 */
import { TILE, MAZE_COLS, MAZE_ROWS } from '../../src/config.js';

/** Create a 28×31 grid filled entirely with walls. */
export function createWallMaze() {
  return Array.from({ length: MAZE_ROWS }, () =>
    new Array(MAZE_COLS).fill(TILE.WALL)
  );
}

/**
 * Standard test maze — walls around the border, open interior with dots,
 * plus a power pellet, tunnel, and ghost house for coverage.
 *
 * Layout (rows 0–6, cols 0–6 — rest is walls):
 *   W W W W W W W
 *   W . . . . T W    (T = tunnel)
 *   W . W . P . W    (P = power pellet)
 *   W . . . W . W
 *   W . W G . . W    (G = ghost house)
 *   W . . . . . W
 *   W W W W W W W
 */
export function createStandardTestMaze() {
  const grid = createWallMaze();

  // Carve open area (rows 1–5, cols 1–5) filled with dots
  for (let r = 1; r <= 5; r++) {
    for (let c = 1; c <= 5; c++) {
      grid[r][c] = TILE.DOT;
    }
  }

  // Internal walls
  grid[2][2] = TILE.WALL;
  grid[3][4] = TILE.WALL;
  grid[4][2] = TILE.WALL;

  // Special tiles
  grid[2][4] = TILE.POWER_PELLET;
  grid[1][5] = TILE.TUNNEL;
  grid[4][3] = TILE.GHOST_HOUSE;

  return grid;
}

/**
 * A straight horizontal corridor for simple movement tests.
 * Row 1, cols 1–8: all dots. Everything else is walls.
 */
export function createCorridorMaze() {
  const grid = createWallMaze();
  for (let c = 1; c <= 8; c++) {
    grid[1][c] = TILE.DOT;
  }
  return grid;
}

/**
 * A maze with exactly N dots for testing isCleared / win condition.
 * @param {number} dotCount — how many dots to place (max 20)
 */
export function createDotCountMaze(dotCount) {
  const grid = createWallMaze();
  let placed = 0;
  for (let c = 1; c <= 20 && placed < dotCount; c++) {
    grid[1][c] = TILE.DOT;
    placed++;
  }
  return grid;
}
