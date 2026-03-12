# Project Context

- **Owner:** Jordi Sune
- **Project:** Classic Pac-Man game — 2D pixel art arcade game built in HTML5
- **Stack:** HTML5, JavaScript, Canvas API, pixel art sprites
- **Description:** A nostalgic recreation of the classic Pac-Man arcade game, inspired by the owner's childhood memories of playing on Atari
- **Created:** 2026-03-12

## Learnings

<!-- Append new learnings below. Each entry is something lasting about the project. -->

### 2026-03-12 — Project Architecture (from Mikey)

**Your tasks depend on this architecture:**
- **Maze grid:** 28×31 tiles, 16px each. Integer grid stored in `maze.js`. Tile types are enum-based in `config.js`.
- **Your work:** Fill `maze.js` LEVEL_1 array with actual level layout (0=wall, 1=path, 2=power pellet, etc.).
- **Game loop:** Fixed-timestep accumulator at 60 Hz. Your data needs to be consumed by this loop.
- **Renderer reads, never writes.** Your maze data is read-only once passed to game.js.
- **Constants hub:** `config.js` has all TILE, SPEED, etc. Coordinate with Chunk if you need new constants.
