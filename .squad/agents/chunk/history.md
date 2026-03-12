# Project Context

- **Owner:** Jordi Sune
- **Project:** Classic Pac-Man game — 2D pixel art arcade game built in HTML5
- **Stack:** HTML5, JavaScript, Canvas API, pixel art sprites
- **Description:** A nostalgic recreation of the classic Pac-Man arcade game, inspired by the owner's childhood memories of playing on Atari
- **Created:** 2026-03-12

## Learnings

<!-- Append new learnings below. Each entry is something lasting about the project. -->

### 2026-03-12 — Test Infrastructure Setup (Chunk)

**Framework:** Node.js built-in `node:test` module with `node:assert/strict`. Zero dependencies, matches the project's no-bundler philosophy. Run via `npm test`.

**Test structure:** `tests/` directory with per-module test files and `tests/helpers/` for fixtures.

**Key patterns:**
- **Test mazes:** Full 28×31 grids (matching MAZE_COLS/MAZE_ROWS) filled with WALL, then carve specific layouts. Avoids out-of-bounds issues in `getTile()`.
- **Singleton reset:** The `maze` module exports a singleton. Call `maze.load(testMaze)` in `beforeEach` to reset state. Each test file runs in a separate Node worker, so no cross-file contamination.
- **Game logic without DOM:** Instead of importing `game.js` (which pulls in renderer/HUD/DOM deps), replicate the `_checkDotEating()` logic using the same primitives (maze, pacman, config). Tests exercise identical code paths without mocking Canvas.
- **Float precision:** Ghost speed (1.8) causes FP accumulation over multiple ticks. Use approximate comparison (`Math.abs(a - b) < 0.001`) instead of `strictEqual`.

**Notable finding — _canMove behavior:**
Pac-Man's `_canMove(dir)` checks center of the *next* pixel position `(x + dir*speed + TILE_SIZE/2)`. From a tile center with speed=2 and TILE_SIZE=16, this check always lands within the current tile. Wall blocking only kicks in after several ticks when the check pixel crosses into the adjacent wall tile. Tests verify eventual stopping, not immediate blocking.

**Coverage:** 111 tests across 5 files covering config enums, maze operations, Pac-Man movement/collision, ghost modes/speed, scoring, dot eating, power mode, and win conditions.

**Gaps to fill later:** Tunnel wrapping, ghost AI pathfinding, multi-ghost collision chains (SCORE_GHOST doubling), life loss/game-over flow, level transitions.

### 2026-03-12 — Project Architecture (from Mikey)

**Your implementation context:**
- **Game loop:** Fixed-timestep accumulator in `game.js` at 60 Hz. Your sprites and AI update here.
- **Entities:** Classes with `spawn()`, `update()`, `getCurrentTile()`. Pacman and Ghost already stub-created; you implement.
- **Collision & AI:** `game.js` orchestrates interactions. Never have entities reference each other directly.
- **Renderer:** `renderer.js` reads state, draws. Never touches game logic.
- **Maze grid:** 28×31 integer grid in `maze.js`. Query via `maze.getTileAt(x, y)`.
- **Constants:** `config.js` has TILE enum, SPEED, DIMENSIONS. Add sprite paths/art metadata there.
- **Still needed:** Sprite art (create `assets/sprites/`?), collision detection, ghost AI (chase/scatter/frightened modes), sound, game state machine (playing/paused/game-over).
