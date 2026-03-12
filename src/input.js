/**
 * Input — Keyboard handler.
 *
 * Captures directional input and exposes the last-requested direction.
 * Pac-Man uses "desired direction" buffering: the player presses a key
 * and Pac-Man turns that way at the next valid opportunity.
 */
import { DIRECTION } from './config.js';

const KEY_MAP = {
  ArrowUp:    DIRECTION.UP,
  ArrowDown:  DIRECTION.DOWN,
  ArrowLeft:  DIRECTION.LEFT,
  ArrowRight: DIRECTION.RIGHT,
  w: DIRECTION.UP,
  s: DIRECTION.DOWN,
  a: DIRECTION.LEFT,
  d: DIRECTION.RIGHT,
};

class Input {
  constructor() {
    this.desiredDirection = DIRECTION.NONE;
    this._onKeyDown = this._onKeyDown.bind(this);
  }

  /** Start listening for keyboard events. */
  bind() {
    window.addEventListener('keydown', this._onKeyDown);
  }

  /** Stop listening (cleanup). */
  unbind() {
    window.removeEventListener('keydown', this._onKeyDown);
  }

  _onKeyDown(e) {
    const dir = KEY_MAP[e.key];
    if (dir) {
      e.preventDefault();
      this.desiredDirection = dir;
    }
  }
}

// Singleton — one input handler for the whole game
export const input = new Input();
