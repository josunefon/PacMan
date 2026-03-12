---
name: "project-conventions"
description: "Core conventions and patterns for this codebase"
domain: "project-conventions"
confidence: "medium"
source: "template"
---

## Context

Pac-Man arcade game in vanilla HTML5/JS/Canvas. No frameworks, no build tools.

## Patterns

### Module System

ES modules (`import`/`export`). No bundler. Script tag uses `type="module"`.

### Constants in config.js

All game constants (tile size, speeds, scores, enums) live in `src/config.js`. Never hardcode tuning values in other files.

### Fixed-Timestep Game Loop

`game.js` uses an accumulator pattern: `update()` at fixed 60 Hz, `draw()` at monitor refresh rate. Never multiply game values by delta-time.

### Renderer Reads, Never Writes

`renderer.js` draws the current state. It never mutates game state. Game logic never calls canvas APIs directly.

### Tile-Based Position Logic

All positions use the tile grid via `maze.js` helpers (`pixelToTile`, `tileToPixel`, `isWalkable`). No free-floating pixel math.

### Entity Pattern

Entities are classes with `spawn(col, row)`, `update()`, and `getCurrentTile()`. They import `maze` for navigation but don't reference each other — `game.js` handles interactions.

### File Structure

- `src/` — All JavaScript source code
- `src/entities/` — Game entity classes (pacman, ghosts)
- `src/ui/` — HUD and menu rendering
- `css/` — Styles (minimal — game renders on canvas)
- `assets/sprites/` — Pixel art sprite images

### Code Style

- camelCase for variables and functions
- PascalCase for classes
- UPPER_SNAKE_CASE for constants
- No semicolons are fine, but be consistent per file (currently using semicolons)

### Dev Server

`npm start` or `npm run dev` runs `http-server` on port 8080.

## Examples

```js
// Importing from config — always use named exports
import { TILE_SIZE, DIRECTION, STATE } from './config.js';

// Checking tile walkability — always go through maze module
const tile = maze.pixelToTile(x, y);
if (maze.isWalkable(tile.col, tile.row)) { ... }
```

## Anti-Patterns

- **Inline magic numbers** — Put constants in `config.js`.
- **Rendering in entity classes** — Entities don't know about canvas. Drawing is renderer's job.
- **Direct DOM manipulation** — The game draws on canvas. Don't create DOM elements for game objects.
- **Delta-time multiplication** — The fixed timestep handles this. Don't multiply speeds by dt.
