/**
 * Pac-Man entity tests — movement, direction buffering, wall collision.
 */
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import { TILE_SIZE, PACMAN_SPEED, DIRECTION } from '../src/config.js';
import { maze } from '../src/maze.js';
import { Pacman } from '../src/entities/pacman.js';
import { createCorridorMaze, createStandardTestMaze } from './helpers/test-mazes.js';

let pacman;

// ── spawn ───────────────────────────────────────────────

describe('Pacman.spawn()', () => {
  beforeEach(() => {
    maze.load(createCorridorMaze());
    pacman = new Pacman();
  });

  it('positions at correct pixel coordinates', () => {
    pacman.spawn(3, 1);
    assert.equal(pacman.x, 3 * TILE_SIZE);
    assert.equal(pacman.y, 1 * TILE_SIZE);
  });

  it('resets direction to NONE', () => {
    pacman.direction = DIRECTION.LEFT;
    pacman.spawn(1, 1);
    assert.equal(pacman.direction, DIRECTION.NONE);
  });

  it('resets nextDirection to NONE', () => {
    pacman.nextDirection = DIRECTION.RIGHT;
    pacman.spawn(1, 1);
    assert.equal(pacman.nextDirection, DIRECTION.NONE);
  });
});

// ── update / movement ───────────────────────────────────

describe('Pacman.update()', () => {
  beforeEach(() => {
    // Corridor: row 1, cols 1–8 are DOT, everything else WALL
    maze.load(createCorridorMaze());
    pacman = new Pacman();
    pacman.spawn(1, 1);  // pixel (16, 16), tile center, walkable
  });

  it('does not move when direction is NONE', () => {
    const startX = pacman.x;
    const startY = pacman.y;
    pacman.update();
    assert.equal(pacman.x, startX);
    assert.equal(pacman.y, startY);
  });

  it('moves right by PACMAN_SPEED pixels per tick', () => {
    pacman.direction = DIRECTION.RIGHT;
    const startX = pacman.x;
    pacman.update();
    assert.equal(pacman.x, startX + PACMAN_SPEED);
  });

  it('moves left by PACMAN_SPEED pixels per tick', () => {
    // Start further right so we have room to move left
    pacman.spawn(4, 1);
    pacman.direction = DIRECTION.LEFT;
    const startX = pacman.x;
    pacman.update();
    assert.equal(pacman.x, startX - PACMAN_SPEED);
  });

  it('accumulates movement over multiple ticks', () => {
    pacman.direction = DIRECTION.RIGHT;
    const startX = pacman.x;
    const ticks = 5;
    for (let i = 0; i < ticks; i++) {
      pacman.update();
    }
    assert.equal(pacman.x, startX + PACMAN_SPEED * ticks);
  });

  it('increments animFrame on each update', () => {
    const startFrame = pacman.animFrame;
    pacman.update();
    pacman.update();
    assert.equal(pacman.animFrame, startFrame + 2);
  });
});

// ── wall collision ──────────────────────────────────────

describe('Pacman wall collision', () => {
  beforeEach(() => {
    maze.load(createCorridorMaze());
    pacman = new Pacman();
  });

  it('stops before entering the wall tile above (UP)', () => {
    // _canMove checks center of next position: (nextX+8, nextY+8)
    // From tile center, the first few ticks still check within current tile.
    // Pacman stops once the check pixel would cross into the wall tile.
    pacman.spawn(1, 1); // pixel (16, 16)
    pacman.direction = DIRECTION.UP;

    // Run enough ticks for Pacman to reach the wall boundary
    for (let i = 0; i < 20; i++) pacman.update();

    // Should stop before entering wall tile (0,0)
    const tile = pacman.getCurrentTile();
    assert.deepEqual(tile, { col: 1, row: 1 }, 'should stay in walkable tile');
    assert.ok(pacman.y >= 0, 'should not go past maze top');
  });

  it('stops before entering the wall tile below (DOWN)', () => {
    pacman.spawn(1, 1);
    pacman.direction = DIRECTION.DOWN; // row 2 is wall

    for (let i = 0; i < 20; i++) pacman.update();

    const tile = pacman.getCurrentTile();
    assert.deepEqual(tile, { col: 1, row: 1 }, 'should stay in walkable tile');
  });

  it('stops at the end of the corridor (RIGHT)', () => {
    pacman.spawn(8, 1); // last walkable tile in corridor
    pacman.direction = DIRECTION.RIGHT;

    for (let i = 0; i < 20; i++) pacman.update();

    // Should never enter tile (9, 1) which is a wall
    const tile = pacman.getCurrentTile();
    assert.equal(tile.col, 8, 'should stay in last walkable column');
    assert.equal(tile.row, 1);
  });

  it('stops immediately at tile center when wall is ahead', () => {
    // With tile-based wall checking, Pac-Man stops at the tile center
    // if the next tile in that direction is a wall — no mid-tile drift.
    pacman.spawn(1, 1);
    pacman.direction = DIRECTION.UP;
    const startY = pacman.y;
    pacman.update();
    // Pac-Man does NOT move because UP leads to wall tile (1,0)
    assert.equal(pacman.y, startY, 'should not move toward wall');
    assert.equal(pacman.direction, DIRECTION.NONE, 'direction cleared at wall');
  });
});

// ── direction buffering ─────────────────────────────────

describe('Pacman direction buffering', () => {
  beforeEach(() => {
    maze.load(createStandardTestMaze());
    pacman = new Pacman();
  });

  it('applies nextDirection at tile center when path is clear', () => {
    // Spawn at (1,1), direction RIGHT, buffer DOWN
    pacman.spawn(1, 1);
    pacman.direction = DIRECTION.RIGHT;
    pacman.nextDirection = DIRECTION.DOWN;

    // At tile center → should accept the buffered direction (down is walkable)
    pacman.update();
    assert.equal(pacman.direction, DIRECTION.DOWN, 'should turn down at tile center');
    assert.equal(pacman.nextDirection, DIRECTION.NONE, 'buffer should be consumed');
  });

  it('accepts buffered direction at tile center (all adjacent checks pass from center)', () => {
    // From a tile center, _canMove checks (x ± speed + 8, y ± speed + 8)
    // which always falls within the current tile when speed < TILE_SIZE/2.
    // So ANY buffered direction is accepted at an interior tile center.
    pacman.spawn(3, 3); // interior tile in standard test maze
    pacman.direction = DIRECTION.RIGHT;
    pacman.nextDirection = DIRECTION.UP;

    pacman.update();
    // UP is accepted because the check pixel stays in tile (3,3)
    assert.deepEqual(pacman.direction, DIRECTION.UP);
    assert.equal(pacman.nextDirection, DIRECTION.NONE, 'buffer consumed');
  });

  it('does not apply nextDirection between tile centers', () => {
    // Spawn at (1,1), move RIGHT one tick (now at x=18, not tile-aligned)
    pacman.spawn(1, 1);
    pacman.direction = DIRECTION.RIGHT;
    pacman.update(); // x = 18

    // Now buffer a DOWN direction
    pacman.nextDirection = DIRECTION.DOWN;
    pacman.update(); // x = 20, still not tile-aligned (16*2=32 needed)

    // Should still be going RIGHT since we're between tile centers
    assert.equal(pacman.direction, DIRECTION.RIGHT);
  });
});

// ── getCurrentTile ──────────────────────────────────────

describe('Pacman.getCurrentTile()', () => {
  beforeEach(() => {
    maze.load(createCorridorMaze());
    pacman = new Pacman();
  });

  it('returns spawn tile correctly', () => {
    pacman.spawn(3, 1);
    const tile = pacman.getCurrentTile();
    assert.deepEqual(tile, { col: 3, row: 1 });
  });

  it('updates after movement crosses tile boundary', () => {
    pacman.spawn(1, 1);
    pacman.direction = DIRECTION.RIGHT;

    // Move 8 ticks × 2px = 16px = exactly one tile
    for (let i = 0; i < TILE_SIZE / PACMAN_SPEED; i++) {
      pacman.update();
    }
    const tile = pacman.getCurrentTile();
    assert.deepEqual(tile, { col: 2, row: 1 });
  });
});
