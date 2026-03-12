/**
 * Ghost entity tests — spawning, mode transitions, movement speed.
 */
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  TILE_SIZE, GHOST_SPEED, GHOST_FRIGHTENED_SPEED, DIRECTION,
} from '../src/config.js';
import { maze } from '../src/maze.js';
import { Ghost, GHOST_MODES } from '../src/entities/ghost.js';
import { createCorridorMaze } from './helpers/test-mazes.js';

let ghost;

// ── Constructor ─────────────────────────────────────────

describe('Ghost constructor', () => {
  it('stores name and color', () => {
    ghost = new Ghost('blinky', '#FF0000');
    assert.equal(ghost.name, 'blinky');
    assert.equal(ghost.color, '#FF0000');
  });

  it('starts in SCATTER mode', () => {
    ghost = new Ghost('pinky', '#FFB8FF');
    assert.equal(ghost.mode, GHOST_MODES.SCATTER);
  });

  it('starts with GHOST_SPEED', () => {
    ghost = new Ghost('inky', '#00FFFF');
    assert.equal(ghost.speed, GHOST_SPEED);
  });

  it('starts with direction NONE', () => {
    ghost = new Ghost('clyde', '#FFB852');
    assert.equal(ghost.direction, DIRECTION.NONE);
  });
});

// ── spawn ───────────────────────────────────────────────

describe('Ghost.spawn()', () => {
  beforeEach(() => {
    maze.load(createCorridorMaze());
    ghost = new Ghost('blinky', '#FF0000');
  });

  it('positions at correct pixel coordinates', () => {
    ghost.spawn(3, 1);
    assert.equal(ghost.x, 3 * TILE_SIZE);
    assert.equal(ghost.y, 1 * TILE_SIZE);
  });

  it('sets direction to LEFT', () => {
    ghost.spawn(3, 1);
    assert.deepEqual(ghost.direction, DIRECTION.LEFT);
  });
});

// ── frighten / normalMode ───────────────────────────────

describe('Ghost mode transitions', () => {
  beforeEach(() => {
    ghost = new Ghost('blinky', '#FF0000');
  });

  it('frighten() changes mode to FRIGHTENED', () => {
    ghost.frighten();
    assert.equal(ghost.mode, GHOST_MODES.FRIGHTENED);
  });

  it('frighten() changes color to blue', () => {
    ghost.frighten();
    assert.equal(ghost.color, '#2121DE');
  });

  it('reset() restores mode to SCATTER', () => {
    ghost.frighten();
    ghost.reset();
    assert.equal(ghost.mode, GHOST_MODES.SCATTER);
  });

  it('reset() restores original color', () => {
    ghost.frighten();
    assert.equal(ghost.color, '#2121DE', 'should be blue when frightened');
    ghost.reset();
    assert.equal(ghost.color, '#FF0000');
  });

  it('can cycle: scatter → frightened → scatter', () => {
    assert.equal(ghost.mode, GHOST_MODES.SCATTER);
    ghost.frighten();
    assert.equal(ghost.mode, GHOST_MODES.FRIGHTENED);
    ghost.reset();
    assert.equal(ghost.mode, GHOST_MODES.SCATTER);
  });

  it('double-frighten stays FRIGHTENED', () => {
    ghost.frighten();
    ghost.frighten();
    assert.equal(ghost.mode, GHOST_MODES.FRIGHTENED);
  });
});

// ── update / movement ───────────────────────────────────

describe('Ghost.update()', () => {
  beforeEach(() => {
    maze.load(createCorridorMaze());
    ghost = new Ghost('blinky', '#FF0000');
    ghost.spawn(4, 1); // pixel (64, 16)
  });

  it('does not move when inGhostHouse is true', () => {
    ghost.inGhostHouse = true;
    const startX = ghost.x;
    const startY = ghost.y;
    const mockPacman = { getCurrentTile: () => ({ col: 1, row: 1 }), direction: DIRECTION.RIGHT };
    ghost.update(mockPacman, ghost);
    assert.equal(ghost.x, startX);
    assert.equal(ghost.y, startY);
  });

  it('moves at GHOST_SPEED in normal mode', () => {
    ghost.direction = DIRECTION.RIGHT;
    const startX = ghost.x;
    ghost.update();
    assert.equal(ghost.x, startX + GHOST_SPEED);
  });

  it('moves at GHOST_FRIGHTENED_SPEED when frightened', () => {
    ghost.frighten();
    const startX = ghost.x;
    const startY = ghost.y;
    const mockPacman = { getCurrentTile: () => ({ col: 8, row: 1 }), direction: DIRECTION.RIGHT };
    ghost.update(mockPacman, ghost);
    const dx = Math.abs(ghost.x - startX);
    const dy = Math.abs(ghost.y - startY);
    assert.equal(dx + dy, GHOST_FRIGHTENED_SPEED, 'should move exactly GHOST_FRIGHTENED_SPEED pixels');
  });

  it('accumulates movement over multiple ticks', () => {
    ghost.direction = DIRECTION.RIGHT;
    const startX = ghost.x;
    const ticks = 5;
    for (let i = 0; i < ticks; i++) {
      ghost.update();
    }
    const expected = startX + GHOST_SPEED * ticks;
    const actual = ghost.x;
    assert.ok(
      Math.abs(actual - expected) < 0.001,
      `expected ≈${expected}, got ${actual} (FP tolerance)`
    );
  });
});

// ── getCurrentTile ──────────────────────────────────────

describe('Ghost.getCurrentTile()', () => {
  beforeEach(() => {
    maze.load(createCorridorMaze());
    ghost = new Ghost('blinky', '#FF0000');
  });

  it('returns spawn tile correctly', () => {
    ghost.spawn(5, 1);
    const tile = ghost.getCurrentTile();
    assert.deepEqual(tile, { col: 5, row: 1 });
  });

  it('returns correct tile after movement', () => {
    ghost.spawn(1, 1);
    ghost.direction = DIRECTION.RIGHT;
    // Move exactly one tile: 16px / 2px per tick = 8 ticks
    // After 1 tick: x = 16 + 2 = 18
    // getCurrentTile uses center: (18 + 8, 16 + 8) = (26, 24) → floor(26/16)=1
    ghost.update();
    const tile = ghost.getCurrentTile();
    assert.deepEqual(tile, { col: 1, row: 1 }, 'still in same tile after 1 tick');
  });
});

// ── GHOST_MODES export ──────────────────────────────────

describe('GHOST_MODES', () => {
  it('has all four mode strings', () => {
    assert.equal(GHOST_MODES.SCATTER, 'scatter');
    assert.equal(GHOST_MODES.CHASE, 'chase');
    assert.equal(GHOST_MODES.FRIGHTENED, 'frightened');
    assert.equal(GHOST_MODES.EATEN, 'eaten');
  });
});
