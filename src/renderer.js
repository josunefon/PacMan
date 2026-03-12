/**
 * Renderer — All canvas drawing lives here.
 *
 * The renderer reads game state and draws it. It never mutates state.
 * This keeps rendering concerns (colors, sprites, scaling) completely
 * separate from game logic.
 */
import {
  TILE, TILE_SIZE, MAZE_COLS, MAZE_ROWS,
  CANVAS_WIDTH, CANVAS_HEIGHT, SCALE,
  PACMAN_ANIM_SPEED, PACMAN_MOUTH_ANGLES,
} from './config.js';
import { maze } from './maze.js';

class Renderer {
  constructor() {
    /** @type {HTMLCanvasElement} */
    this.canvas = null;
    /** @type {CanvasRenderingContext2D} */
    this.ctx = null;
    this.frameCount = 0;
    this._powerModeTimer = 0;
  }

  /** Initialize the canvas element and context. */
  init(canvasEl) {
    this.canvas = canvasEl;
    this.canvas.width = CANVAS_WIDTH;
    this.canvas.height = CANVAS_HEIGHT;

    // Scale up for crisp pixels on modern displays
    this.canvas.style.width = `${CANVAS_WIDTH * SCALE}px`;
    this.canvas.style.height = `${CANVAS_HEIGHT * SCALE}px`;

    this.ctx = this.canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;
  }

  /** Clear the entire canvas. */
  clear() {
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  // ── Maze ──────────────────────────────────────────

  /** Draw the maze: wall outlines, dots, power pellets, and ghost house gate. */
  drawMaze() {
    for (let row = 0; row < MAZE_ROWS; row++) {
      for (let col = 0; col < MAZE_COLS; col++) {
        const tile = maze.getTile(col, row);
        const x = col * TILE_SIZE;
        const y = row * TILE_SIZE;

        if (tile === TILE.WALL) {
          this._drawWallTile(col, row, x, y);
        } else if (tile === TILE.DOT) {
          this.ctx.fillStyle = '#FCB5B8';
          this.ctx.beginPath();
          this.ctx.arc(x + TILE_SIZE / 2, y + TILE_SIZE / 2, 2, 0, Math.PI * 2);
          this.ctx.fill();
        } else if (tile === TILE.POWER_PELLET) {
          const pulse = Math.abs(Math.sin(this.frameCount * 0.05));
          const radius = 3 + pulse * 3;
          this.ctx.fillStyle = '#FCB5B8';
          this.ctx.beginPath();
          this.ctx.arc(x + TILE_SIZE / 2, y + TILE_SIZE / 2, radius, 0, Math.PI * 2);
          this.ctx.fill();
        }
      }
    }

    this._drawGhostHouseGate();
  }

  /** Draw a wall tile as outline borders on sides facing non-wall tiles. */
  _drawWallTile(col, row, x, y) {
    const ctx = this.ctx;
    ctx.strokeStyle = '#2121DE';
    ctx.lineWidth = 2;

    const isWall = (c, r) => {
      if (c < 0 || c >= MAZE_COLS || r < 0 || r >= MAZE_ROWS) return false;
      return maze.getTile(c, r) === TILE.WALL;
    };

    if (!isWall(col, row - 1)) {
      ctx.beginPath();
      ctx.moveTo(x, y + 1);
      ctx.lineTo(x + TILE_SIZE, y + 1);
      ctx.stroke();
    }
    if (!isWall(col, row + 1)) {
      ctx.beginPath();
      ctx.moveTo(x, y + TILE_SIZE - 1);
      ctx.lineTo(x + TILE_SIZE, y + TILE_SIZE - 1);
      ctx.stroke();
    }
    if (!isWall(col - 1, row)) {
      ctx.beginPath();
      ctx.moveTo(x + 1, y);
      ctx.lineTo(x + 1, y + TILE_SIZE);
      ctx.stroke();
    }
    if (!isWall(col + 1, row)) {
      ctx.beginPath();
      ctx.moveTo(x + TILE_SIZE - 1, y);
      ctx.lineTo(x + TILE_SIZE - 1, y + TILE_SIZE);
      ctx.stroke();
    }
  }

  /** Draw the ghost house entrance gate (pink/magenta line). */
  _drawGhostHouseGate() {
    const x = 13 * TILE_SIZE;
    const y = 12 * TILE_SIZE + TILE_SIZE / 2;
    this.ctx.strokeStyle = '#FFB8FF';
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
    this.ctx.lineTo(x + TILE_SIZE * 2, y);
    this.ctx.stroke();
  }

  // ── Pac-Man ───────────────────────────────────────

  /** Draw Pac-Man with animated mouth and directional rotation. */
  drawPacman(pacman) {
    const cx = pacman.x + TILE_SIZE / 2;
    const cy = pacman.y + TILE_SIZE / 2;
    const r = TILE_SIZE / 2 - 1;

    // Mouth animation from pacman.animFrame
    const animIndex = Math.floor((pacman.animFrame || 0) / PACMAN_ANIM_SPEED)
      % PACMAN_MOUTH_ANGLES.length;
    const mouthAngle = PACMAN_MOUTH_ANGLES[animIndex] * Math.PI;

    // Rotation based on movement direction
    let rotation = 0;
    const dir = pacman.direction;
    if (dir) {
      if (dir.x === 1)       rotation = 0;               // RIGHT
      else if (dir.y === 1)  rotation = Math.PI / 2;     // DOWN
      else if (dir.x === -1) rotation = Math.PI;         // LEFT
      else if (dir.y === -1) rotation = 3 * Math.PI / 2; // UP
    }

    this.ctx.save();
    this.ctx.translate(cx, cy);
    this.ctx.rotate(rotation);

    this.ctx.fillStyle = '#FFFF00';
    this.ctx.beginPath();
    this.ctx.arc(0, 0, r, mouthAngle, Math.PI * 2 - mouthAngle);
    this.ctx.lineTo(0, 0);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.restore();
  }

  // ── Ghosts ────────────────────────────────────────

  /** Draw a ghost with body shape, eyes, and mode-specific appearance. */
  drawGhost(ghost) {
    const cx = ghost.x + TILE_SIZE / 2;
    const cy = ghost.y + TILE_SIZE / 2;
    const r = TILE_SIZE / 2 - 1;
    const ctx = this.ctx;

    const isEaten = ghost.mode === 'eaten';
    const isFrightened = ghost.mode === 'frightened';

    if (!isEaten) {
      // Body color
      if (isFrightened) {
        const flashThreshold = 2000;
        if (this._powerModeTimer <= flashThreshold
            && Math.floor(this.frameCount / 10) % 2 === 0) {
          ctx.fillStyle = '#FFFFFF';
        } else {
          ctx.fillStyle = '#2121DE';
        }
      } else {
        ctx.fillStyle = ghost.color;
      }

      // Ghost body: rounded top + wavy bottom with 3 feet
      ctx.beginPath();
      ctx.arc(cx, cy - 2, r, Math.PI, 0, false);
      ctx.lineTo(cx + r, cy + r - 1);

      const bottom = cy + r - 1;
      const waveH = 3;
      const segW = (r * 2) / 3;
      for (let i = 0; i < 3; i++) {
        const sx = cx + r - i * segW;
        const ex = sx - segW;
        const midX = (sx + ex) / 2;
        ctx.quadraticCurveTo(midX, bottom + waveH, ex, bottom);
      }

      ctx.closePath();
      ctx.fill();

      // Frightened face instead of normal eyes
      if (isFrightened) {
        this._drawFrightenedFace(cx, cy);
        return;
      }
    }

    // Eyes (always drawn, including eaten mode)
    this._drawGhostEyes(ghost, cx, cy);
  }

  /** Draw frightened-mode face: small dot eyes and wavy mouth. */
  _drawFrightenedFace(cx, cy) {
    const ctx = this.ctx;
    const eyeY = cy - 3;

    // Dot eyes
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(cx - 4, eyeY, 2, 2);
    ctx.fillRect(cx + 2, eyeY, 2, 2);

    // Wavy mouth
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1;
    ctx.beginPath();
    const mouthY = cy + 3;
    ctx.moveTo(cx - 5, mouthY);
    for (let i = 0; i < 4; i++) {
      const mx = cx - 5 + (i + 0.5) * 2.5;
      const my = mouthY + (i % 2 === 0 ? -1.5 : 1.5);
      ctx.lineTo(mx, my);
    }
    ctx.lineTo(cx + 5, mouthY);
    ctx.stroke();
  }

  /** Draw ghost eyes with directional pupils. */
  _drawGhostEyes(ghost, cx, cy) {
    const ctx = this.ctx;
    const eyeY = cy - 3;
    const leftEyeX = cx - 4;
    const rightEyeX = cx + 2;
    const eyeW = 5;
    const eyeH = 6;

    // White sclera
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.ellipse(leftEyeX + eyeW / 2, eyeY + eyeH / 2,
      eyeW / 2, eyeH / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(rightEyeX + eyeW / 2, eyeY + eyeH / 2,
      eyeW / 2, eyeH / 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Pupil position shifts in the movement direction
    let px = 0, py = 0;
    const dir = ghost.direction;
    if (dir) {
      px = (dir.x || 0) * 1.5;
      py = (dir.y || 0) * 1.5;
    }

    ctx.fillStyle = '#2121DE';
    ctx.beginPath();
    ctx.arc(leftEyeX + eyeW / 2 + px, eyeY + eyeH / 2 + py,
      1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(rightEyeX + eyeW / 2 + px, eyeY + eyeH / 2 + py,
      1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── Main draw ─────────────────────────────────────

  /** Draw the full frame. Called once per render tick. */
  draw(gameState) {
    this.frameCount++;
    this._powerModeTimer = gameState.powerModeTimer || 0;

    this.clear();
    this.drawMaze();

    if (gameState.pacman) {
      this.drawPacman(gameState.pacman);
    }

    if (gameState.ghosts) {
      for (const ghost of gameState.ghosts) {
        this.drawGhost(ghost);
      }
    }
  }
}

export const renderer = new Renderer();
