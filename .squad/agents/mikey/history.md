# Project Context

- **Owner:** Jordi Sune
- **Project:** Classic Pac-Man game — 2D pixel art arcade game built in HTML5
- **Stack:** HTML5, JavaScript, Canvas API, pixel art sprites
- **Description:** A nostalgic recreation of the classic Pac-Man arcade game, inspired by the owner's childhood memories of playing on Atari
- **Created:** 2026-03-12

## Learnings

<!-- Append new learnings below. Each entry is something lasting about the project. -->

### 2026-03-12 — Initial Architecture

- **Project structure created.** Files: `index.html`, `package.json`, `css/style.css`, and `src/` with `main.js`, `game.js`, `config.js`, `input.js`, `maze.js`, `renderer.js`, `entities/pacman.js`, `entities/ghost.js`, `ui/hud.js`.
- **Game loop pattern:** Fixed-timestep accumulator in `game.js`. Updates at 60 Hz, renders at monitor rate.
- **Module boundary rule:** Renderer reads state, never writes. Game logic never touches canvas. Constants in `config.js`.
- **Maze is a 2D integer grid** (28×31 tiles, 16px per tile). Tile types defined in `config.TILE` enum. `maze.js` owns all grid operations.
- **Entity pattern:** Classes with `spawn()`, `update()`, `getCurrentTile()`. Entities don't reference each other — `game.js` orchestrates interactions.
- **No bundler.** ES modules, `type="module"` in script tag. Dev server via `npx http-server`.
- **Key file paths:** `src/config.js` (constants), `src/game.js` (loop), `src/maze.js` (level data), `src/renderer.js` (drawing), `src/entities/` (Pac-Man, ghosts), `src/ui/hud.js` (HUD).
- **Still needed:** Real maze level data (the LEVEL_1 array in `maze.js` is empty — Data needs to fill it). Sprite art. Ghost AI. Sound. Collision detection implementation.
