/**
 * Game-wide constants. Single source of truth for tuning values.
 * Change numbers here, not scattered through the codebase.
 */

// ── Tile Grid ───────────────────────────────────────
export const TILE_SIZE = 16;          // px per tile (original Pac-Man uses 8, we double it)
export const MAZE_COLS = 28;          // classic maze width in tiles
export const MAZE_ROWS = 31;          // classic maze height in tiles

// ── Canvas ──────────────────────────────────────────
export const CANVAS_WIDTH = TILE_SIZE * MAZE_COLS;   // 448
export const CANVAS_HEIGHT = TILE_SIZE * MAZE_ROWS;  // 496
export const SCALE = 2;              // render scale multiplier

// ── Timing ──────────────────────────────────────────
export const TARGET_FPS = 60;
export const TICK_RATE = 1000 / TARGET_FPS;  // ms per fixed update

// ── Pac-Man ─────────────────────────────────────────
export const PACMAN_SPEED = 2;        // pixels per tick at base speed

// ── Ghosts ──────────────────────────────────────────
export const GHOST_SPEED = 2;         // must divide TILE_SIZE evenly for tile-center alignment
export const GHOST_FRIGHTENED_SPEED = 1.0;

// ── Scoring ─────────────────────────────────────────
export const SCORE_DOT = 10;
export const SCORE_POWER_PELLET = 50;
export const SCORE_GHOST = 200;       // doubles for each ghost in a chain
export const EXTRA_LIFE_SCORE = 10000;

// ── Gameplay ────────────────────────────────────────
export const POWER_PELLET_DURATION = 6000;  // ms
export const LIVES_START = 3;

// ── Tile Types (used in maze data) ──────────────────
export const TILE = {
  EMPTY: 0,
  WALL: 1,
  DOT: 2,
  POWER_PELLET: 3,
  GHOST_HOUSE: 4,
  TUNNEL: 5,
};

// ── Directions ──────────────────────────────────────
export const DIRECTION = {
  NONE: null,
  UP:    { x:  0, y: -1 },
  DOWN:  { x:  0, y:  1 },
  LEFT:  { x: -1, y:  0 },
  RIGHT: { x:  1, y:  0 },
};

// ── Game States ─────────────────────────────────────
export const STATE = {
  LOADING:  'loading',
  READY:    'ready',
  PLAYING:  'playing',
  DYING:    'dying',
  GAME_OVER: 'game_over',
  PAUSED:   'paused',
  WIN:      'win',
};

// ── Ghost Mode Timing (ms) ──────────────────────────
export const GHOST_SCATTER_DURATION = 7000;
export const GHOST_CHASE_DURATION = 20000;
export const GHOST_FRIGHTENED_DURATION = 6000;
export const GHOST_EATEN_SPEED = 4;

// ── Ghost Scatter Targets (corner tiles) ─────────────
export const SCATTER_TARGETS = {
  blinky: { col: 25, row: 0 },   // top-right
  pinky:  { col: 2,  row: 0 },   // top-left
  inky:   { col: 27, row: 30 },  // bottom-right
  clyde:  { col: 0,  row: 30 },  // bottom-left
};

// ── Ghost House ──────────────────────────────────────
export const GHOST_HOUSE_EXIT = { col: 14, row: 11 };
export const GHOST_RELEASE_INTERVAL = 5000; // ms between ghost releases

// ── Pac-Man Animation ────────────────────────────────
export const PACMAN_ANIM_SPEED = 4; // frames per mouth cycle step
export const PACMAN_MOUTH_ANGLES = [0, 0.15, 0.3, 0.15]; // mouth opening in radians * PI

// ── Tunnel ───────────────────────────────────────────
export const TUNNEL_SPEED_FACTOR = 0.5; // entities slow down in tunnel
export const TUNNEL_ROW = 14;
