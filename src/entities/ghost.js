/**
 * Ghost entity — full AI implementation.
 *
 * Each ghost has a unique chase personality (Blinky, Pinky, Inky, Clyde).
 * Movement is tile-to-tile: at every tile center the ghost picks the next
 * direction whose neighbor tile is closest (Euclidean) to its current target.
 * Ghosts never reverse except when entering FRIGHTENED mode.
 */
import {
  TILE_SIZE, GHOST_SPEED, GHOST_FRIGHTENED_SPEED, DIRECTION, TILE, MAZE_COLS,
  GHOST_EATEN_SPEED, SCATTER_TARGETS, GHOST_HOUSE_EXIT, TUNNEL_SPEED_FACTOR,
} from '../config.js';
import { maze } from '../maze.js';

const GHOST_MODES = {
  SCATTER:    'scatter',
  CHASE:      'chase',
  FRIGHTENED: 'frightened',
  EATEN:      'eaten',
};

const ALL_DIRECTIONS = [DIRECTION.UP, DIRECTION.DOWN, DIRECTION.LEFT, DIRECTION.RIGHT];

function opposite(dir) {
  if (!dir) return null;
  return ALL_DIRECTIONS.find(d => d.x === -dir.x && d.y === -dir.y) || null;
}

function euclidean(c1, r1, c2, r2) {
  return Math.sqrt((c1 - c2) ** 2 + (r1 - r2) ** 2);
}

export class Ghost {
  /**
   * @param {string} name  — blinky | pinky | inky | clyde
   * @param {string} color — CSS color for rendering
   */
  constructor(name, color) {
    this.name = name;
    this.color = color;
    this.originalColor = color;
    this.x = 0;
    this.y = 0;
    this.direction = DIRECTION.NONE;
    this.speed = GHOST_SPEED;
    this.mode = GHOST_MODES.SCATTER;
    this.inGhostHouse = false;
    this._spawnCol = 0;
    this._spawnRow = 0;
  }

  /** Place ghost at a tile position. */
  spawn(col, row) {
    this._spawnCol = col;
    this._spawnRow = row;
    const pos = maze.tileToPixel(col, row);
    this.x = pos.x;
    this.y = pos.y;
    this.direction = DIRECTION.LEFT;
    this.mode = GHOST_MODES.SCATTER;
    this.color = this.originalColor;
  }

  /**
   * Main update — called once per tick by game.js.
   * @param {Pacman} pacman  — needed for chase targeting
   * @param {Ghost}  [blinky] — needed for Inky's targeting algorithm
   */
  update(pacman, blinky) {
    // Ghosts waiting inside the house just bob up/down; real release is handled
    // externally by game.js setting inGhostHouse = false.
    if (this.inGhostHouse) {
      return;
    }

    const atCenter = this.x % TILE_SIZE === 0 && this.y % TILE_SIZE === 0;

    if (atCenter) {
      const tile = this.getCurrentTile();
      const target = this._getTarget(pacman, blinky);
      this.direction = this._chooseDirection(target);
      // Safety: stop if chosen direction leads to a wall
      if (this.direction && !maze.isWalkable(
        tile.col + this.direction.x, tile.row + this.direction.y
      )) {
        this.direction = DIRECTION.NONE;
      }
    }

    // Determine effective speed
    let speed = this._effectiveSpeed();

    if (this.direction) {
      this.x += this.direction.x * speed;
      this.y += this.direction.y * speed;
    }

    // Tunnel wrapping for ghosts
    const maxX = (MAZE_COLS - 1) * TILE_SIZE;
    if (this.x < 0) this.x = maxX;
    else if (this.x > maxX) this.x = 0;
  }

  /** Enter frightened mode — reverse direction immediately. */
  frighten() {
    if (this.mode === GHOST_MODES.EATEN) return; // don't interrupt eaten
    this.mode = GHOST_MODES.FRIGHTENED;
    this.color = '#2121DE';
    // Ghosts reverse direction when frightened
    if (this.direction) {
      const rev = opposite(this.direction);
      if (rev) this.direction = rev;
    }
  }

  /** Ghost was eaten by Pac-Man — eyes mode, rush back to ghost house. */
  eat() {
    this.mode = GHOST_MODES.EATEN;
    this.color = 'transparent';
  }

  /** Return to normal after reaching ghost house (called by game.js). */
  reset() {
    this.mode = GHOST_MODES.SCATTER;
    this.color = this.originalColor;
    this.inGhostHouse = false;
  }

  /** Force ghost back to a normal mode, restoring original color.
   *  Used when power pellet expires or eaten ghost reaches the house. */
  recover(newMode) {
    this.mode = newMode;
    this.color = this.originalColor;
  }

  /** Switch between SCATTER and CHASE (called by game.js timer). */
  setMode(mode) {
    if (this.mode === GHOST_MODES.FRIGHTENED || this.mode === GHOST_MODES.EATEN) return;
    const wasMode = this.mode;
    this.mode = mode;
    // Reverse direction on scatter/chase transition
    if (wasMode !== mode && this.direction) {
      const rev = opposite(this.direction);
      if (rev) this.direction = rev;
    }
  }

  /** Get the tile this ghost currently occupies. */
  getCurrentTile() {
    return maze.pixelToTile(this.x + TILE_SIZE / 2, this.y + TILE_SIZE / 2);
  }

  // ── Private helpers ───────────────────────────────────

  _effectiveSpeed() {
    if (this.mode === GHOST_MODES.EATEN) return GHOST_EATEN_SPEED;
    if (this.mode === GHOST_MODES.FRIGHTENED) {
      return GHOST_FRIGHTENED_SPEED;
    }

    let speed = this.speed;
    // Slow down in tunnel
    const tile = this.getCurrentTile();
    if (maze.getTile && maze.getTile(tile.col, tile.row) === TILE.TUNNEL) {
      speed *= TUNNEL_SPEED_FACTOR;
    }
    return speed;
  }

  /** Determine the target tile based on current mode and ghost personality. */
  _getTarget(pacman, blinky) {
    switch (this.mode) {
      case GHOST_MODES.SCATTER:
        return SCATTER_TARGETS[this.name] || { col: 0, row: 0 };

      case GHOST_MODES.CHASE:
        return this._chaseTarget(pacman, blinky);

      case GHOST_MODES.EATEN:
        return GHOST_HOUSE_EXIT;

      case GHOST_MODES.FRIGHTENED:
      default:
        return null; // random direction — handled in _chooseDirection
    }
  }

  /** Per-ghost chase personality. */
  _chaseTarget(pacman, blinky) {
    const pTile = pacman.getCurrentTile();
    const pDir = pacman.direction || { x: 0, y: 0 };

    switch (this.name) {
      case 'blinky':
        // Target Pac-Man directly
        return pTile;

      case 'pinky':
        // 4 tiles ahead of Pac-Man
        return { col: pTile.col + pDir.x * 4, row: pTile.row + pDir.y * 4 };

      case 'inky': {
        // 2 tiles ahead of Pac-Man, then double vector from Blinky
        const ahead = { col: pTile.col + pDir.x * 2, row: pTile.row + pDir.y * 2 };
        if (blinky) {
          const bTile = blinky.getCurrentTile();
          return {
            col: ahead.col + (ahead.col - bTile.col),
            row: ahead.row + (ahead.row - bTile.row),
          };
        }
        return ahead;
      }

      case 'clyde': {
        // If > 8 tiles from Pac-Man, target Pac-Man; else scatter corner
        const cTile = this.getCurrentTile();
        const dist = euclidean(cTile.col, cTile.row, pTile.col, pTile.row);
        if (dist > 8) return pTile;
        return SCATTER_TARGETS[this.name];
      }

      default:
        return pTile;
    }
  }

  /**
   * At an intersection choose the direction whose next tile is closest to target.
   * Ghosts cannot reverse (except on mode change, handled elsewhere).
   * In FRIGHTENED mode, pick a random valid direction.
   */
  _chooseDirection(target) {
    const tile = this.getCurrentTile();
    const rev = opposite(this.direction);

    // Gather all walkable neighbor directions (excluding reverse)
    const candidates = ALL_DIRECTIONS.filter(dir => {
      if (rev && dir.x === rev.x && dir.y === rev.y) return false;
      const nc = tile.col + dir.x;
      const nr = tile.row + dir.y;
      return maze.isWalkable(nc, nr);
    });

    if (candidates.length === 0) {
      // Dead end — only option is to reverse
      return rev || this.direction;
    }

    if (candidates.length === 1) {
      return candidates[0];
    }

    // Frightened: random
    if (this.mode === GHOST_MODES.FRIGHTENED) {
      return candidates[Math.floor(Math.random() * candidates.length)];
    }

    // Pick direction closest to target (Euclidean distance)
    if (!target) return candidates[0];

    let best = candidates[0];
    let bestDist = Infinity;
    for (const dir of candidates) {
      const nc = tile.col + dir.x;
      const nr = tile.row + dir.y;
      const d = euclidean(nc, nr, target.col, target.row);
      if (d < bestDist) {
        bestDist = d;
        best = dir;
      }
    }
    return best;
  }
}

export { GHOST_MODES };
