/**
 * Pac-Man entity.
 *
 * Owns position, direction, animation state.
 * Movement logic: Pac-Man moves continuously in his current direction.
 * When the player inputs a new direction, it's buffered as "desired."
 * At each tile boundary, we check if the desired direction is walkable.
 */
import { TILE_SIZE, PACMAN_SPEED, DIRECTION, TILE, MAZE_COLS, TUNNEL_SPEED_FACTOR } from '../config.js';
import { maze } from '../maze.js';

export class Pacman {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.direction = DIRECTION.NONE;
    this.nextDirection = DIRECTION.NONE;
    this.speed = PACMAN_SPEED;
    this.animFrame = 0;
    this._spawnCol = 0;
    this._spawnRow = 0;
  }

  /** Place Pac-Man at a tile position. */
  spawn(col, row) {
    this._spawnCol = col;
    this._spawnRow = row;
    const pos = maze.tileToPixel(col, row);
    this.x = pos.x;
    this.y = pos.y;
    this.direction = DIRECTION.NONE;
    this.nextDirection = DIRECTION.NONE;
    this.animFrame = 0;
  }

  /** Reset to last spawn position (used on death / restart). */
  reset() {
    this.spawn(this._spawnCol, this._spawnRow);
  }

  /** Update position. Called once per fixed timestep. */
  update() {
    // Determine effective speed (slow down in tunnel)
    let speed = this.speed;
    const curTile = this.getCurrentTile();
    if (maze.getTile && maze.getTile(curTile.col, curTile.row) === TILE.TUNNEL) {
      speed *= TUNNEL_SPEED_FACTOR;
    }

    if (this._isAtTileCenter()) {
      // At tile boundary — try direction change
      if (this.nextDirection && this._isTileWalkable(this.nextDirection)) {
        this.direction = this.nextDirection;
        this.nextDirection = DIRECTION.NONE;
      }
      // Stop at tile center when blocked (prevents getting stuck between tiles)
      if (this.direction && !this._isTileWalkable(this.direction)) {
        this.direction = DIRECTION.NONE;
      }
    }

    // Move in current direction (wall was checked at tile center)
    if (this.direction) {
      this.x += this.direction.x * speed;
      this.y += this.direction.y * speed;
    }

    // Tunnel wrapping
    const maxX = (MAZE_COLS - 1) * TILE_SIZE;
    if (this.x < 0) this.x = maxX;
    else if (this.x > maxX) this.x = 0;

    this.animFrame++;
  }

  /** Check if Pac-Man is aligned to the tile grid. */
  _isAtTileCenter() {
    return this.x % TILE_SIZE === 0 && this.y % TILE_SIZE === 0;
  }

  /** Check if moving in a direction is possible at a given speed. */
  _canMoveAt(dir, speed) {
    const nextX = this.x + dir.x * speed;
    const nextY = this.y + dir.y * speed;
    const tile = maze.pixelToTile(
      nextX + TILE_SIZE / 2,
      nextY + TILE_SIZE / 2
    );
    return maze.isWalkable(tile.col, tile.row);
  }

  /** Check if moving in a direction is possible. */
  _canMove(dir) {
    return this._canMoveAt(dir, this.speed);
  }

  /** Check if the NEXT TILE in a direction is walkable (tile-based, not pixel-based). */
  _isTileWalkable(dir) {
    const tile = this.getCurrentTile();
    return maze.isWalkable(tile.col + dir.x, tile.row + dir.y);
  }

  /** Get the tile Pac-Man currently occupies. */
  getCurrentTile() {
    return maze.pixelToTile(
      this.x + TILE_SIZE / 2,
      this.y + TILE_SIZE / 2
    );
  }
}
