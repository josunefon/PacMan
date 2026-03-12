/**
 * HUD — Heads-Up Display.
 *
 * Draws score, lives, and level info on the canvas.
 * Keeps UI rendering separate from game-world rendering.
 *
 * Layout mirrors the original arcade:
 *   Top:    "1UP" + score (left), "HIGH SCORE" + value (center)
 *   Bottom: lives as Pac-Man icons (left), level indicator (right)
 */
import { CANVAS_WIDTH, CANVAS_HEIGHT, TILE_SIZE } from '../config.js';

const FONT = '"Press Start 2P", monospace';
const HUD_FONT_SIZE = 8;

export class Hud {
  /**
   * @param {CanvasRenderingContext2D} ctx
   */
  constructor(ctx) {
    this.ctx = ctx;
    this.highScore = 0;
  }

  /** Draw score, lives, high score, and level. */
  draw(score, lives, level) {
    if (score > this.highScore) this.highScore = score;

    const ctx = this.ctx;
    ctx.font = `${HUD_FONT_SIZE}px ${FONT}`;

    // "1UP" label — top left
    ctx.fillStyle = '#FFF';
    ctx.textAlign = 'left';
    ctx.fillText('1UP', 24, 10);

    // Score value — below "1UP"
    ctx.fillText(String(score).padStart(6, ' '), 8, 22);

    // "HIGH SCORE" label — top center
    ctx.textAlign = 'center';
    ctx.fillText('HIGH SCORE', CANVAS_WIDTH / 2, 10);

    // High score value — below label
    ctx.fillText(String(this.highScore).padStart(6, ' '), CANVAS_WIDTH / 2, 22);

    // Lives — bottom left as Pac-Man icons (show lives - 1, current life is in play)
    const livesToShow = Math.max(0, lives - 1);
    for (let i = 0; i < livesToShow; i++) {
      this._drawLifeIcon(20 + i * 18, CANVAS_HEIGHT - 10);
    }

    // Level indicator — bottom right
    ctx.fillStyle = '#FFF';
    ctx.font = `${HUD_FONT_SIZE}px ${FONT}`;
    ctx.textAlign = 'right';
    ctx.fillText(`L${level}`, CANVAS_WIDTH - 12, CANVAS_HEIGHT - 6);
  }

  /** Draw a small Pac-Man icon for lives display. */
  _drawLifeIcon(x, y) {
    const ctx = this.ctx;
    ctx.fillStyle = '#FFFF00';
    ctx.beginPath();
    ctx.arc(x, y, 6, 0.25 * Math.PI, 1.75 * Math.PI);
    ctx.lineTo(x, y);
    ctx.closePath();
    ctx.fill();
  }

  /** Draw "READY!" text. */
  drawReady() {
    this.ctx.fillStyle = '#FFFF00';
    this.ctx.font = `14px ${FONT}`;
    this.ctx.textAlign = 'center';
    this.ctx.fillText('READY!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 4);
  }

  /** Draw "GAME OVER" text (canvas fallback). */
  drawGameOver() {
    this.ctx.fillStyle = '#FF0000';
    this.ctx.font = `14px ${FONT}`;
    this.ctx.textAlign = 'center';
    this.ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 4);
  }
}
