/**
 * Maze tests — level loading, tile queries, dot tracking.
 */
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import { TILE, TILE_SIZE, MAZE_COLS, MAZE_ROWS } from '../src/config.js';
import { maze } from '../src/maze.js';
import {
  createStandardTestMaze,
  createWallMaze,
  createCorridorMaze,
  createDotCountMaze,
} from './helpers/test-mazes.js';

// ── Loading ─────────────────────────────────────────────

describe('Maze.load()', () => {
  it('populates the grid from level data', () => {
    const level = createStandardTestMaze();
    maze.load(level);

    assert.equal(maze.getTile(0, 0), TILE.WALL, 'corner should be wall');
    assert.equal(maze.getTile(1, 1), TILE.DOT, 'interior should be dot');
    assert.equal(maze.getTile(2, 2), TILE.WALL, 'internal wall');
    assert.equal(maze.getTile(4, 2), TILE.POWER_PELLET, 'power pellet');
    assert.equal(maze.getTile(5, 1), TILE.TUNNEL, 'tunnel tile');
    assert.equal(maze.getTile(3, 4), TILE.GHOST_HOUSE, 'ghost house');
  });

  it('deep-copies the level data (mutations do not affect source)', () => {
    const level = createCorridorMaze();
    maze.load(level);
    maze.setTile(1, 1, TILE.EMPTY);
    assert.equal(level[1][1], TILE.DOT, 'source array should be unchanged');
  });

  it('counts totalDots (DOT + POWER_PELLET)', () => {
    const level = createStandardTestMaze();
    maze.load(level);

    // Standard test maze: 5×5 interior = 25 tiles
    // Minus 3 internal walls, 1 tunnel, 1 ghost house = 20 dots + power pellets
    // Power pellet count: 1
    // Dot count: 19
    // totalDots should be 20
    assert.equal(maze.totalDots, 20);
  });

  it('resets dotsEaten to 0', () => {
    const level = createStandardTestMaze();
    maze.load(level);
    maze.dotsEaten = 5; // simulate eating
    maze.load(level);   // reload
    assert.equal(maze.dotsEaten, 0);
  });
});

// ── getTile ─────────────────────────────────────────────

describe('Maze.getTile()', () => {
  beforeEach(() => {
    maze.load(createStandardTestMaze());
  });

  it('returns correct tile for valid coordinates', () => {
    assert.equal(maze.getTile(1, 1), TILE.DOT);
    assert.equal(maze.getTile(0, 0), TILE.WALL);
  });

  it('returns WALL for negative row', () => {
    assert.equal(maze.getTile(1, -1), TILE.WALL);
  });

  it('returns WALL for negative col', () => {
    assert.equal(maze.getTile(-1, 1), TILE.WALL);
  });

  it('returns WALL for row >= MAZE_ROWS', () => {
    assert.equal(maze.getTile(1, MAZE_ROWS), TILE.WALL);
    assert.equal(maze.getTile(1, MAZE_ROWS + 10), TILE.WALL);
  });

  it('returns WALL for col >= MAZE_COLS', () => {
    assert.equal(maze.getTile(MAZE_COLS, 1), TILE.WALL);
    assert.equal(maze.getTile(MAZE_COLS + 10, 1), TILE.WALL);
  });
});

// ── setTile ─────────────────────────────────────────────

describe('Maze.setTile()', () => {
  beforeEach(() => {
    maze.load(createStandardTestMaze());
  });

  it('clears a dot (DOT → EMPTY)', () => {
    assert.equal(maze.getTile(1, 1), TILE.DOT);
    maze.setTile(1, 1, TILE.EMPTY);
    assert.equal(maze.getTile(1, 1), TILE.EMPTY);
  });

  it('clears a power pellet (POWER_PELLET → EMPTY)', () => {
    assert.equal(maze.getTile(4, 2), TILE.POWER_PELLET);
    maze.setTile(4, 2, TILE.EMPTY);
    assert.equal(maze.getTile(4, 2), TILE.EMPTY);
  });

  it('ignores out-of-bounds coordinates gracefully', () => {
    // Should not throw
    maze.setTile(-1, -1, TILE.EMPTY);
    maze.setTile(MAZE_COLS, MAZE_ROWS, TILE.EMPTY);
  });
});

// ── isWalkable ──────────────────────────────────────────

describe('Maze.isWalkable()', () => {
  beforeEach(() => {
    maze.load(createStandardTestMaze());
  });

  it('returns false for WALL', () => {
    assert.equal(maze.isWalkable(0, 0), false);
  });

  it('returns false for GHOST_HOUSE', () => {
    assert.equal(maze.isWalkable(3, 4), false);
  });

  it('returns true for DOT', () => {
    assert.equal(maze.isWalkable(1, 1), true);
  });

  it('returns true for EMPTY', () => {
    maze.setTile(1, 1, TILE.EMPTY);
    assert.equal(maze.isWalkable(1, 1), true);
  });

  it('returns true for POWER_PELLET', () => {
    assert.equal(maze.isWalkable(4, 2), true);
  });

  it('returns true for TUNNEL', () => {
    assert.equal(maze.isWalkable(5, 1), true);
  });

  it('returns false for out-of-bounds (treated as WALL)', () => {
    assert.equal(maze.isWalkable(-1, 0), false);
    assert.equal(maze.isWalkable(0, MAZE_ROWS), false);
  });
});

// ── pixelToTile ─────────────────────────────────────────

describe('Maze.pixelToTile()', () => {
  it('converts origin (0,0) to tile (0,0)', () => {
    const t = maze.pixelToTile(0, 0);
    assert.deepEqual(t, { col: 0, row: 0 });
  });

  it('converts pixel (24,24) to tile (1,1) with TILE_SIZE=16', () => {
    const t = maze.pixelToTile(24, 24);
    assert.deepEqual(t, { col: 1, row: 1 });
  });

  it('converts pixel at tile boundary (16,16) to tile (1,1)', () => {
    const t = maze.pixelToTile(16, 16);
    assert.deepEqual(t, { col: 1, row: 1 });
  });

  it('converts pixel just before boundary (15,15) to tile (0,0)', () => {
    const t = maze.pixelToTile(15, 15);
    assert.deepEqual(t, { col: 0, row: 0 });
  });

  it('handles larger coordinates', () => {
    // Tile (5,3) starts at pixel (80,48)
    const t = maze.pixelToTile(80, 48);
    assert.deepEqual(t, { col: 5, row: 3 });
  });
});

// ── tileToPixel ─────────────────────────────────────────

describe('Maze.tileToPixel()', () => {
  it('converts tile (0,0) to pixel (0,0)', () => {
    const p = maze.tileToPixel(0, 0);
    assert.deepEqual(p, { x: 0, y: 0 });
  });

  it('converts tile (1,1) to pixel (16,16)', () => {
    const p = maze.tileToPixel(1, 1);
    assert.deepEqual(p, { x: 16, y: 16 });
  });

  it('converts tile (5,3) to pixel (80,48)', () => {
    const p = maze.tileToPixel(5, 3);
    assert.deepEqual(p, { x: 80, y: 48 });
  });
});

// ── pixelToTile ↔ tileToPixel roundtrip ─────────────────

describe('pixelToTile ↔ tileToPixel roundtrip', () => {
  it('tileToPixel then pixelToTile returns the same tile', () => {
    for (let col = 0; col < 10; col++) {
      for (let row = 0; row < 10; row++) {
        const px = maze.tileToPixel(col, row);
        const tile = maze.pixelToTile(px.x, px.y);
        assert.deepEqual(tile, { col, row }, `roundtrip failed for (${col},${row})`);
      }
    }
  });
});

// ── isCleared / dotsEaten ───────────────────────────────

describe('Maze.isCleared()', () => {
  it('returns false when dots remain', () => {
    maze.load(createDotCountMaze(5));
    assert.equal(maze.isCleared(), false);
  });

  it('returns true when dotsEaten equals totalDots', () => {
    maze.load(createDotCountMaze(3));
    maze.dotsEaten = 3;
    assert.equal(maze.isCleared(), true);
  });

  it('returns true when dotsEaten exceeds totalDots', () => {
    maze.load(createDotCountMaze(3));
    maze.dotsEaten = 5;
    assert.equal(maze.isCleared(), true);
  });

  it('returns true for a maze with zero dots', () => {
    maze.load(createWallMaze());
    assert.equal(maze.totalDots, 0);
    assert.equal(maze.isCleared(), true);
  });
});

describe('dotsEaten tracking', () => {
  it('starts at 0 after load', () => {
    maze.load(createStandardTestMaze());
    assert.equal(maze.dotsEaten, 0);
  });

  it('increments manually (game logic owns incrementing)', () => {
    maze.load(createDotCountMaze(5));
    maze.dotsEaten++;
    assert.equal(maze.dotsEaten, 1);
    maze.dotsEaten++;
    assert.equal(maze.dotsEaten, 2);
  });
});
