/**
 * Config tests — verify constants and enums are consistent.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  TILE, DIRECTION, STATE,
  TILE_SIZE, MAZE_COLS, MAZE_ROWS,
  CANVAS_WIDTH, CANVAS_HEIGHT,
  PACMAN_SPEED, GHOST_SPEED, GHOST_FRIGHTENED_SPEED,
  SCORE_DOT, SCORE_POWER_PELLET, SCORE_GHOST,
  LIVES_START, POWER_PELLET_DURATION,
} from '../src/config.js';

// ── TILE Enum ───────────────────────────────────────────

describe('TILE enum', () => {
  it('has expected integer values', () => {
    assert.equal(TILE.EMPTY, 0);
    assert.equal(TILE.WALL, 1);
    assert.equal(TILE.DOT, 2);
    assert.equal(TILE.POWER_PELLET, 3);
    assert.equal(TILE.GHOST_HOUSE, 4);
    assert.equal(TILE.TUNNEL, 5);
  });

  it('has exactly 6 tile types', () => {
    assert.equal(Object.keys(TILE).length, 6);
  });

  it('all values are unique', () => {
    const values = Object.values(TILE);
    const unique = new Set(values);
    assert.equal(unique.size, values.length);
  });
});

// ── DIRECTION Enum ──────────────────────────────────────

describe('DIRECTION enum', () => {
  it('NONE is null', () => {
    assert.equal(DIRECTION.NONE, null);
  });

  it('UP points negative Y', () => {
    assert.deepEqual(DIRECTION.UP, { x: 0, y: -1 });
  });

  it('DOWN points positive Y', () => {
    assert.deepEqual(DIRECTION.DOWN, { x: 0, y: 1 });
  });

  it('LEFT points negative X', () => {
    assert.deepEqual(DIRECTION.LEFT, { x: -1, y: 0 });
  });

  it('RIGHT points positive X', () => {
    assert.deepEqual(DIRECTION.RIGHT, { x: 1, y: 0 });
  });

  it('non-NONE directions are unit vectors (Manhattan length 1)', () => {
    for (const [name, dir] of Object.entries(DIRECTION)) {
      if (dir === null) continue;
      const manhattan = Math.abs(dir.x) + Math.abs(dir.y);
      assert.equal(manhattan, 1, `${name} should be a unit vector`);
    }
  });
});

// ── Canvas Dimensions ───────────────────────────────────

describe('Canvas dimensions', () => {
  it('CANVAS_WIDTH = TILE_SIZE × MAZE_COLS', () => {
    assert.equal(CANVAS_WIDTH, TILE_SIZE * MAZE_COLS);
  });

  it('CANVAS_HEIGHT = TILE_SIZE × MAZE_ROWS', () => {
    assert.equal(CANVAS_HEIGHT, TILE_SIZE * MAZE_ROWS);
  });

  it('computes to 448×496 at tile size 16', () => {
    assert.equal(CANVAS_WIDTH, 448);
    assert.equal(CANVAS_HEIGHT, 496);
  });
});

// ── Scoring Constants ───────────────────────────────────

describe('Scoring constants', () => {
  it('SCORE_DOT is 10', () => {
    assert.equal(SCORE_DOT, 10);
  });

  it('SCORE_POWER_PELLET is 50', () => {
    assert.equal(SCORE_POWER_PELLET, 50);
  });

  it('SCORE_GHOST is 200', () => {
    assert.equal(SCORE_GHOST, 200);
  });

  it('all scoring values are positive integers', () => {
    for (const val of [SCORE_DOT, SCORE_POWER_PELLET, SCORE_GHOST]) {
      assert.ok(Number.isInteger(val) && val > 0);
    }
  });
});

// ── Game States ─────────────────────────────────────────

describe('STATE enum', () => {
  it('has expected state strings', () => {
    assert.equal(STATE.LOADING, 'loading');
    assert.equal(STATE.READY, 'ready');
    assert.equal(STATE.PLAYING, 'playing');
    assert.equal(STATE.DYING, 'dying');
    assert.equal(STATE.GAME_OVER, 'game_over');
    assert.equal(STATE.PAUSED, 'paused');
    assert.equal(STATE.WIN, 'win');
  });

  it('all state values are unique', () => {
    const values = Object.values(STATE);
    const unique = new Set(values);
    assert.equal(unique.size, values.length);
  });
});

// ── Speed Constants ─────────────────────────────────────

describe('Speed constants', () => {
  it('Pac-Man is at least as fast as ghosts', () => {
    assert.ok(PACMAN_SPEED >= GHOST_SPEED);
  });

  it('frightened ghosts are slower than normal ghosts', () => {
    assert.ok(GHOST_FRIGHTENED_SPEED < GHOST_SPEED);
  });
});

// ── Gameplay Constants ──────────────────────────────────

describe('Gameplay constants', () => {
  it('starts with 3 lives', () => {
    assert.equal(LIVES_START, 3);
  });

  it('power pellet duration is positive', () => {
    assert.ok(POWER_PELLET_DURATION > 0);
  });
});
