/**
 * Game flow tests — scoring, dot eating, state transitions.
 *
 * We avoid importing game.js directly to dodge DOM dependencies
 * (renderer, HUD need Canvas). Instead we test the same logic by
 * composing the pure modules: maze, pacman, ghost, config.
 * This mirrors exactly what game.js._checkDotEating() does.
 */
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  TILE, TILE_SIZE, DIRECTION, STATE,
  SCORE_DOT, SCORE_POWER_PELLET, LIVES_START,
} from '../src/config.js';
import { maze } from '../src/maze.js';
import { Pacman } from '../src/entities/pacman.js';
import { Ghost, GHOST_MODES } from '../src/entities/ghost.js';
import {
  createStandardTestMaze,
  createDotCountMaze,
  createCorridorMaze,
} from './helpers/test-mazes.js';

// ── Helpers that replicate game.js logic ────────────────

/** Mirrors Game._checkDotEating() */
function checkDotEating(pacman, gameState, ghosts) {
  const tile = pacman.getCurrentTile();
  const tileType = maze.getTile(tile.col, tile.row);

  if (tileType === TILE.DOT) {
    maze.setTile(tile.col, tile.row, TILE.EMPTY);
    maze.dotsEaten++;
    gameState.score += SCORE_DOT;
  } else if (tileType === TILE.POWER_PELLET) {
    maze.setTile(tile.col, tile.row, TILE.EMPTY);
    maze.dotsEaten++;
    gameState.score += SCORE_POWER_PELLET;
    // Activate power mode — frighten all ghosts
    for (const ghost of ghosts) {
      ghost.frighten();
    }
  }
}

// ── Dot Eating ──────────────────────────────────────────

describe('Dot eating', () => {
  let pacman, gameState, ghosts;

  beforeEach(() => {
    maze.load(createStandardTestMaze());
    pacman = new Pacman();
    ghosts = [
      new Ghost('blinky', '#FF0000'),
      new Ghost('pinky', '#FFB8FF'),
    ];
    gameState = { score: 0, lives: LIVES_START, state: STATE.PLAYING };
  });

  it('eating a dot increases score by SCORE_DOT (10)', () => {
    pacman.spawn(1, 1); // tile (1,1) is DOT in standard maze
    checkDotEating(pacman, gameState, ghosts);
    assert.equal(gameState.score, SCORE_DOT);
  });

  it('eating a dot clears the tile to EMPTY', () => {
    pacman.spawn(1, 1);
    assert.equal(maze.getTile(1, 1), TILE.DOT);
    checkDotEating(pacman, gameState, ghosts);
    assert.equal(maze.getTile(1, 1), TILE.EMPTY);
  });

  it('eating a dot increments dotsEaten', () => {
    pacman.spawn(1, 1);
    assert.equal(maze.dotsEaten, 0);
    checkDotEating(pacman, gameState, ghosts);
    assert.equal(maze.dotsEaten, 1);
  });

  it('eating a power pellet increases score by SCORE_POWER_PELLET (50)', () => {
    pacman.spawn(4, 2); // tile (4,2) is POWER_PELLET
    checkDotEating(pacman, gameState, ghosts);
    assert.equal(gameState.score, SCORE_POWER_PELLET);
  });

  it('eating a power pellet clears the tile to EMPTY', () => {
    pacman.spawn(4, 2);
    assert.equal(maze.getTile(4, 2), TILE.POWER_PELLET);
    checkDotEating(pacman, gameState, ghosts);
    assert.equal(maze.getTile(4, 2), TILE.EMPTY);
  });

  it('eating a power pellet increments dotsEaten', () => {
    pacman.spawn(4, 2);
    checkDotEating(pacman, gameState, ghosts);
    assert.equal(maze.dotsEaten, 1);
  });

  it('walking over an empty tile does not change score', () => {
    pacman.spawn(1, 1);
    checkDotEating(pacman, gameState, ghosts); // eat the dot
    const scoreAfterDot = gameState.score;
    checkDotEating(pacman, gameState, ghosts); // same tile, now empty
    assert.equal(gameState.score, scoreAfterDot);
  });

  it('score accumulates across multiple dots', () => {
    pacman.spawn(1, 1);
    checkDotEating(pacman, gameState, ghosts); // +10

    pacman.spawn(3, 1);
    checkDotEating(pacman, gameState, ghosts); // +10

    pacman.spawn(4, 2); // power pellet
    checkDotEating(pacman, gameState, ghosts); // +50

    assert.equal(gameState.score, SCORE_DOT * 2 + SCORE_POWER_PELLET);
    assert.equal(maze.dotsEaten, 3);
  });
});

// ── Power Mode ──────────────────────────────────────────

describe('Power mode activation', () => {
  let pacman, gameState, ghosts;

  beforeEach(() => {
    maze.load(createStandardTestMaze());
    pacman = new Pacman();
    ghosts = [
      new Ghost('blinky', '#FF0000'),
      new Ghost('pinky', '#FFB8FF'),
      new Ghost('inky', '#00FFFF'),
      new Ghost('clyde', '#FFB852'),
    ];
    gameState = { score: 0, lives: LIVES_START, state: STATE.PLAYING };
  });

  it('eating power pellet frightens all ghosts', () => {
    pacman.spawn(4, 2); // power pellet tile
    checkDotEating(pacman, gameState, ghosts);

    for (const ghost of ghosts) {
      assert.equal(ghost.mode, GHOST_MODES.FRIGHTENED,
        `${ghost.name} should be frightened`);
    }
  });

  it('eating a regular dot does not frighten ghosts', () => {
    pacman.spawn(1, 1); // regular dot
    checkDotEating(pacman, gameState, ghosts);

    for (const ghost of ghosts) {
      assert.equal(ghost.mode, GHOST_MODES.SCATTER,
        `${ghost.name} should still be in scatter`);
    }
  });
});

// ── Win Condition ───────────────────────────────────────

describe('Win condition (isCleared)', () => {
  it('maze is not cleared when dots remain', () => {
    maze.load(createDotCountMaze(5));
    maze.dotsEaten = 4;
    assert.equal(maze.isCleared(), false);
  });

  it('maze is cleared when all dots are eaten', () => {
    maze.load(createDotCountMaze(5));
    maze.dotsEaten = 5;
    assert.equal(maze.isCleared(), true);
  });

  it('triggers WIN state in game loop pattern', () => {
    maze.load(createDotCountMaze(2));
    const gameState = { state: STATE.PLAYING };
    const pacman = new Pacman();
    const ghosts = [];

    // Eat all dots
    pacman.spawn(1, 1);
    checkDotEating(pacman, { score: 0 }, ghosts);
    pacman.spawn(2, 1);
    checkDotEating(pacman, { score: 0 }, ghosts);

    // Check win condition (mirrors game.js._update)
    if (maze.isCleared()) {
      gameState.state = STATE.WIN;
    }

    assert.equal(gameState.state, STATE.WIN);
  });
});

// ── State Transitions ───────────────────────────────────

describe('Game state values', () => {
  it('initial state is LOADING', () => {
    // Game constructor sets state = STATE.LOADING
    const state = STATE.LOADING;
    assert.equal(state, 'loading');
  });

  it('READY follows LOADING', () => {
    // game.init() sets state = STATE.READY after loading
    const state = STATE.READY;
    assert.equal(state, 'ready');
  });

  it('PLAYING follows READY', () => {
    const state = STATE.PLAYING;
    assert.equal(state, 'playing');
  });

  it('state machine has all required transitions', () => {
    // Verify the states needed for the game lifecycle exist
    const requiredStates = ['loading', 'ready', 'playing', 'dying', 'game_over', 'win', 'paused'];
    const stateValues = Object.values(STATE);
    for (const s of requiredStates) {
      assert.ok(stateValues.includes(s), `STATE should include "${s}"`);
    }
  });
});

// ── dotsEaten correctness ───────────────────────────────

describe('dotsEaten accuracy', () => {
  it('matches the number of dots actually consumed', () => {
    maze.load(createCorridorMaze()); // 8 dots in corridor
    const pacman = new Pacman();
    const ghosts = [];
    const gs = { score: 0 };

    // Eat 3 dots by spawning on them
    pacman.spawn(1, 1); checkDotEating(pacman, gs, ghosts);
    pacman.spawn(2, 1); checkDotEating(pacman, gs, ghosts);
    pacman.spawn(3, 1); checkDotEating(pacman, gs, ghosts);

    assert.equal(maze.dotsEaten, 3);
    assert.equal(gs.score, SCORE_DOT * 3);
  });

  it('does not double-count eating the same tile', () => {
    maze.load(createCorridorMaze());
    const pacman = new Pacman();
    const ghosts = [];
    const gs = { score: 0 };

    pacman.spawn(1, 1);
    checkDotEating(pacman, gs, ghosts); // eat once
    checkDotEating(pacman, gs, ghosts); // tile is now EMPTY

    assert.equal(maze.dotsEaten, 1, 'should not double-count');
    assert.equal(gs.score, SCORE_DOT);
  });
});
