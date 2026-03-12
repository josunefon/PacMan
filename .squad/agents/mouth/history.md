# Project Context

- **Owner:** Jordi Sune
- **Project:** Classic Pac-Man game — 2D pixel art arcade game built in HTML5
- **Stack:** HTML5, JavaScript, Canvas API, pixel art sprites
- **Description:** A nostalgic recreation of the classic Pac-Man arcade game, inspired by the owner's childhood memories of playing on Atari
- **Created:** 2026-03-12

## Learnings

<!-- Append new learnings below. Each entry is something lasting about the project. -->

### 2026-03-12 — Project Architecture (from Mikey)

**Your documentation should reflect these patterns:**
- **Game loop:** Fixed-timestep accumulator at 60 Hz (updates) × monitor refresh (render).
- **Module boundary rule:** Renderer reads state only. Game logic never touches Canvas. Entities don't talk to each other.
- **File structure:** `src/game.js` (orchestrator), `src/renderer.js` (draw), `src/maze.js` (grid), `src/entities/` (Pacman, ghosts), `src/config.js` (constants), `src/input.js` (keyboard), `src/ui/hud.js` (lives/score).
- **No bundler, no framework.** Vanilla HTML5, ES modules, `npx http-server` for dev.
- **Explain the architecture to users.** Module boundaries are intentional; entity independence keeps code testable.

### 2026-03-12 — Arcade UI Implementation (Mouth)

**UI Architecture Decisions:**
- **Screen overlays are HTML/CSS, not canvas.** Start screen and Game Over screen use positioned `<div>` overlays inside `#game-container`. This keeps UI text crisp and separate from the game renderer.
- **State change callback pattern.** `game.js` exposes `onStateChange` via a getter/setter on the `state` property. `main.js` listens for `STATE.GAME_OVER` to show the overlay. This is the bridge between game logic and UI — minimal coupling.
- **Game does NOT auto-start.** `main.js` shows the start screen first; `game.init(canvas)` is called only when Enter is pressed. `game.restart()` resets state without re-initializing the renderer.
- **HUD layout mirrors original arcade:** "1UP" + score top-left, "HIGH SCORE" top-center, Pac-Man life icons bottom-left, level indicator bottom-right. Font size 8px internal (16px displayed at 2x scale).
- **CRT effects are CSS-only:** Scanline overlay via `repeating-linear-gradient`, neon glow via `box-shadow`, CRT background via `radial-gradient`. All lightweight, no canvas overhead.
- **Responsive scaling uses CSS `transform: scale()`** at discrete breakpoints. This preserves pixel-crisp rendering — no canvas re-initialization needed.
- **Arrow key scroll prevention** is handled globally in `main.js` before game init, so the page never scrolls unexpectedly.
- **Google Fonts "Press Start 2P"** loaded via `<link>` with `preconnect` for fast delivery. CSS fallback: `'Courier New', monospace`.
