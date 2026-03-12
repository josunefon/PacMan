# Squad Decisions

## Active Decisions

### 2026-03-12 — Game Architecture (Mikey, Lead)
- **Module boundaries:** Renderer reads state only; never writes. Game logic never touches Canvas. Entities don't reference each other.
- **Game loop:** Fixed-timestep accumulator at 60 Hz updates, monitor-rate rendering.
- **Maze storage:** 2D integer grid (28×31 tiles, 16px each); tile types via `config.TILE` enum.
- **Entity pattern:** Classes with `spawn()`, `update()`, `getCurrentTile()`; orchestrated by `game.js`.
- **Build:** No bundler. ES modules with `type="module"` in script tag. Dev server: `npx http-server`.
- **Constants hub:** All magic numbers and tile definitions in `src/config.js`.

### 2026-03-12 — Test Framework and Patterns (Chunk, Tester)
- **Test framework:** Node.js built-in `node:test` + `node:assert/strict`. No external dependencies.
- **Test command:** `npm test` → `node --test tests/*.test.js`
- **Test directory:** `tests/` at project root, with `tests/helpers/` for fixtures.
- **Test mazes:** Always use full 28×31 grids to match maze module bounds checking.
- **DOM-dependent modules:** Compose pure modules instead of importing `game.js` directly. Avoids Canvas/DOM mocking.

### 2026-03-12 — UI Screens Use HTML Overlays, Not Canvas (Mouth, UI Developer)
- Start screen, Game Over screen, and future menus are HTML/CSS overlays, not canvas-drawn.
- Overlays positioned inside `#game-container` with `z-index: 10`.
- `main.js` manages overlay visibility; `game.js` exposes `onStateChange` callback and `restart()` method.
- Keeps UI text crisp, supports CSS animations (blinking), respects module boundaries.

## Governance

- All meaningful changes require team consensus
- Document architectural decisions here
- Keep history focused on work, decisions focused on direction
