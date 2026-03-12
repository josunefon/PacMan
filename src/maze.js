/**
 * Maze — Level data and tile queries.
 *
 * The maze is a 2D grid of tile IDs (see config.TILE).
 * This module owns the data and provides helpers to query it.
 * Rendering reads from here; game logic mutates it (eating dots).
 */
import { TILE, MAZE_COLS, MAZE_ROWS, TILE_SIZE } from './config.js';

/**
 * Classic 28×31 Pac-Man maze layout.
 * 0 = empty, 1 = wall, 2 = dot, 3 = power pellet,
 * 4 = ghost house, 5 = tunnel
 *
 * This is a placeholder — Data will fill in the real level data.
 */
const LEVEL_1 = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
  [1,3,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,3,1],
  [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,2,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,2,1],
  [1,2,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,2,1],
  [1,2,2,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,2,2,1],
  [1,1,1,1,1,1,2,1,1,1,1,1,0,1,1,0,1,1,1,1,1,2,1,1,1,1,1,1],
  [0,0,0,0,0,1,2,1,1,1,1,1,0,1,1,0,1,1,1,1,1,2,1,0,0,0,0,0],
  [0,0,0,0,0,1,2,1,1,0,0,0,0,0,0,0,0,0,0,1,1,2,1,0,0,0,0,0],
  [0,0,0,0,0,1,2,1,1,0,1,1,1,4,4,1,1,1,0,1,1,2,1,0,0,0,0,0],
  [1,1,1,1,1,1,2,1,1,0,1,4,4,4,4,4,4,1,0,1,1,2,1,1,1,1,1,1],
  [5,5,5,5,5,5,2,0,0,0,1,4,4,4,4,4,4,1,0,0,0,2,5,5,5,5,5,5],
  [1,1,1,1,1,1,2,1,1,0,1,4,4,4,4,4,4,1,0,1,1,2,1,1,1,1,1,1],
  [0,0,0,0,0,1,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,2,1,0,0,0,0,0],
  [0,0,0,0,0,1,2,1,1,0,0,0,0,0,0,0,0,0,0,1,1,2,1,0,0,0,0,0],
  [0,0,0,0,0,1,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,2,1,0,0,0,0,0],
  [1,1,1,1,1,1,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,2,1,1,1,1,1,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
  [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
  [1,3,2,2,1,1,2,2,2,2,2,2,2,0,0,2,2,2,2,2,2,2,1,1,2,2,3,1],
  [1,1,1,2,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,2,1,1,1],
  [1,1,1,2,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,2,1,1,1],
  [1,2,2,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,2,2,1],
  [1,2,1,1,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,1,1,2,1],
  [1,2,1,1,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,1,1,2,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

class Maze {
  constructor() {
    this.grid = [];
    this.totalDots = 0;
    this.dotsEaten = 0;
  }

  /** Load a level layout (deep copy so we can replay). */
  load(levelData) {
    this.grid = levelData.map(row => [...row]);
    this.dotsEaten = 0;
    this.totalDots = this.grid.flat().filter(
      t => t === TILE.DOT || t === TILE.POWER_PELLET
    ).length;
  }

  /** Get the tile type at a grid position. Returns WALL for out-of-bounds. */
  getTile(col, row) {
    if (row < 0 || row >= MAZE_ROWS || col < 0 || col >= MAZE_COLS) {
      return TILE.WALL;
    }
    return this.grid[row][col];
  }

  /** Set a tile (e.g., clear a dot after eating it). */
  setTile(col, row, value) {
    if (row >= 0 && row < MAZE_ROWS && col >= 0 && col < MAZE_COLS) {
      this.grid[row][col] = value;
    }
  }

  /** Check if Pac-Man can move into this tile. */
  isWalkable(col, row) {
    const tile = this.getTile(col, row);
    return tile !== TILE.WALL && tile !== TILE.GHOST_HOUSE;
  }

  /** Convert pixel position to grid coordinates. */
  pixelToTile(px, py) {
    return {
      col: Math.floor(px / TILE_SIZE),
      row: Math.floor(py / TILE_SIZE),
    };
  }

  /** Convert grid coordinates to pixel position (top-left of tile). */
  tileToPixel(col, row) {
    return {
      x: col * TILE_SIZE,
      y: row * TILE_SIZE,
    };
  }

  /** Are all dots eaten? */
  isCleared() {
    return this.dotsEaten >= this.totalDots;
  }
}

export const maze = new Maze();
export { LEVEL_1 };
